import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: any = null;

export function getDatabase() {
    if (db) return db;

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'firs.db');
    db = new Database(dbPath);

    // performance optimizations
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    return db;
}

export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
