import fs from 'fs';
import path from 'path';
import { randomUUID, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { getDatabase } from './database-connection';

// FIR encryption key from environment
const FIR_ENCRYPTION_KEY = process.env.FIR_ENCRYPTION_KEY || 'default-fir-encryption-key-change-me';

// Synchronous encryption using Node.js crypto (AES-256-GCM)
function encryptFIRDataSync(plaintext: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(FIR_ENCRYPTION_KEY, salt, 32);
  const iv = randomBytes(12);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: salt (16) + iv (12) + authTag (16) + encrypted
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  return combined.toString('base64');
}

function decryptFIRDataSync(ciphertext: string): string {
  try {
    const combined = Buffer.from(ciphertext, 'base64');

    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 28);
    const authTag = combined.subarray(28, 44);
    const encrypted = combined.subarray(44);

    const key = scryptSync(FIR_ENCRYPTION_KEY, salt, 32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    console.warn('Decryption failed, assuming legacy unencrypted data');
    return ciphertext;
  }
}

function getDB() {
  const db = getDatabase();
  initSchema(db);
  return db;
}

function initSchema(d: any) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      mobile TEXT UNIQUE,
      aadhaar TEXT,
      role TEXT,
      passwordHash TEXT,
      passwordSalt TEXT,
      mfaEnabled INTEGER DEFAULT 0,
      mfaSecret TEXT,
      policeStation TEXT,
      badgeNumber TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS firs (
      id TEXT PRIMARY KEY,
      referenceNumber TEXT,
      title TEXT,
      reporterId TEXT,
      status TEXT,
      assignedOfficerId TEXT,
      encryptedData TEXT,
      signature TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      firId TEXT,
      filename TEXT,
      mimetype TEXT,
      size INTEGER,
      createdAt TEXT,
      content TEXT
    );

    CREATE TABLE IF NOT EXISTS timelines (
      id TEXT PRIMARY KEY,
      firId TEXT,
      timestamp TEXT,
      actor TEXT,
      action TEXT,
      details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_firs_reporter ON firs(reporterId);
    CREATE INDEX IF NOT EXISTS idx_timeline_fir ON timelines(firId);
  `);
}

function unpackFIR(fir: any, d: any) {
  if (!fir) return null;

  let data: any = {};
  try {
    if (fir.encryptedData) {
      // Decrypt the encrypted data
      const decryptedJson = decryptFIRDataSync(fir.encryptedData);
      data = JSON.parse(decryptedJson);
    }
  } catch (e) {
    console.error('Failed to parse FIR data', e);
  }

  const timeline = d.prepare('SELECT * FROM timelines WHERE firId = ? ORDER BY timestamp ASC').all(fir.id);
  const mappedTimeline = timeline.map((t: any) => ({
    id: t.id,
    timestamp: t.timestamp,
    action: t.action,
    description: t.details,
    performedBy: t.actor,
    performedByRole: 'system' // Placeholder
  }));

  const docs = d.prepare('SELECT * FROM documents WHERE firId = ? ORDER BY createdAt ASC').all(fir.id);
  let documents = docs.map((doc: any) => doc.filename);

  if (documents.length === 0 && data.documents && Array.isArray(data.documents)) {
    documents = data.documents;
  }

  return {
    ...data,
    ...fir,
    timeline: mappedTimeline,
    documents
  };
}

export function createFIR(payload: Record<string, any>) {
  const d = getDB();
  const id = randomUUID();
  const now = new Date().toISOString();
  const referenceNumber = payload.referenceNumber ?? `FIR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const title = payload.complaintType ?? payload.incidentPlace ?? payload.title ?? 'FIR';

  const stmt = d.prepare(
    `INSERT INTO firs (id, referenceNumber, title, reporterId, status, encryptedData, signature, createdAt, updatedAt)
     VALUES (@id, @referenceNumber, @title, @reporterId, @status, @encryptedData, @signature, @createdAt, @updatedAt)`
  );

  stmt.run({
    id,
    referenceNumber,
    title,
    reporterId: payload.complainantId ?? null,
    status: 'pending',
    encryptedData: encryptFIRDataSync(JSON.stringify(payload)),
    signature: payload.signature ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // Save documents if provided
  if (payload.documents && Array.isArray(payload.documents)) {
    for (const doc of payload.documents) {
      if (typeof doc === 'string') {
        addDocument(id, { filename: doc });
      } else {
        addDocument(id, {
          filename: doc.name,
          mimetype: doc.type,
          size: doc.size,
          content: doc.content // Base64 content
        });
      }
    }
  }

  addTimelineEntry(id, {
    timestamp: now,
    actor: payload.complainantName ?? 'citizen',
    action: 'FIR Submitted',
    details: 'FIR submitted via portal',
  });

  return getFIRById(id);
}

export function getAllFIRs() {
  const d = getDB();
  const rows = d.prepare('SELECT * FROM firs ORDER BY createdAt DESC').all();
  return rows.map((row: any) => unpackFIR(row, d));
}

export function getFIRById(id: string) {
  const d = getDB();
  const fir = d.prepare('SELECT * FROM firs WHERE id = ? OR referenceNumber = ?').get(id, id);
  if (!fir) return null;
  return unpackFIR(fir, d);
}

export function updateFIRStatus(id: string, status: string, actor = 'system', details = '') {
  const d = getDB();
  const now = new Date().toISOString();
  d.prepare('UPDATE firs SET status = ?, updatedAt = ? WHERE id = ? OR referenceNumber = ?').run(status, now, id, id);
  addTimelineEntry(id, { timestamp: now, actor, action: `Status -> ${status}`, details });
  return getFIRById(id);
}

export function assignOfficer(id: string, officerId: string, officerName: string, policeStation: string, actor = 'system') {
  const d = getDB();
  const now = new Date().toISOString();
  d.prepare('UPDATE firs SET assignedOfficerId = ?, updatedAt = ? WHERE id = ? OR referenceNumber = ?').run(officerId, now, id, id);
  addTimelineEntry(id, { timestamp: now, actor, action: `Assigned officer ${officerName}`, details: `Station: ${policeStation}` });
  return getFIRById(id);
}

export function addTimelineEntry(firId: string, entry: { timestamp?: string; actor?: string; action: string; details?: string }) {
  const d = getDB();
  const id = randomUUID();
  const ts = entry.timestamp ?? new Date().toISOString();
  d.prepare('INSERT INTO timelines (id, firId, timestamp, actor, action, details) VALUES (@id, @firId, @timestamp, @actor, @action, @details)').run({
    id,
    firId,
    timestamp: ts,
    actor: entry.actor ?? 'system',
    action: entry.action,
    details: entry.details ?? '',
  });
  return d.prepare('SELECT * FROM timelines WHERE id = ?').get(id);
}

export function addDocument(firId: string, doc: { filename: string; mimetype?: string; size?: number, content?: string }) {
  const d = getDB();
  const id = randomUUID();
  const now = new Date().toISOString();
  d.prepare('INSERT INTO documents (id, firId, filename, mimetype, size, createdAt, content) VALUES (@id, @firId, @filename, @mimetype, @size, @createdAt, @content)').run({
    id,
    firId,
    filename: doc.filename,
    mimetype: doc.mimetype ?? null,
    size: doc.size ?? 0,
    createdAt: now,
    content: doc.content ?? null
  });
  return d.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

// User Management
export function createUser(user: any) {
  const d = getDB();
  const id = randomUUID();
  const now = new Date().toISOString();

  try {
    const stmt = d.prepare(`
      INSERT INTO users (id, name, email, mobile, aadhaar, role, passwordHash, passwordSalt, mfaEnabled, mfaSecret, policeStation, badgeNumber, created_at)
      VALUES (@id, @name, @email, @mobile, @aadhaar, @role, @passwordHash, @passwordSalt, @mfaEnabled, @mfaSecret, @policeStation, @badgeNumber, @created_at)
    `);

    stmt.run({
      id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      aadhaar: user.aadhaar || null,
      role: user.role || 'citizen',
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      mfaEnabled: user.mfaEnabled ? 1 : 0,
      mfaSecret: user.mfaSecret || null,
      policeStation: user.policeStation || null,
      badgeNumber: user.badgeNumber || null,
      created_at: now
    });

    return getUserById(id);
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      throw new Error('User with this email or mobile already exists');
    }
    throw err;
  }
}

export function getUserByEmail(email: string) {
  const d = getDB();
  const user = d.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return null;
  return { ...user, mfaEnabled: !!user.mfaEnabled }; // SQLite stores bools as ints
}
export function getUserByIdentifier(identifier: string) {
  const d = getDB();
  const user = d.prepare('SELECT * FROM users WHERE email = ? OR mobile = ? OR aadhaar = ?').get(identifier, identifier, identifier);
  if (!user) return null;
  return { ...user, mfaEnabled: !!user.mfaEnabled };
}
export function getUserById(id: string) {
  const d = getDB();
  const user = d.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;
  return { ...user, mfaEnabled: !!user.mfaEnabled };
}

