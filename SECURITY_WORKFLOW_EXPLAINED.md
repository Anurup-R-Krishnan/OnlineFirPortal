# How the Online FIR Portal Security Works - Complete Guide

## Overview Flow
```
User Registration → Password Hashing → Storage → Login → Password Verification → MFA → JWT Tokens → Encrypted Data Storage
```

---

## 1. Password Hashing & Storage (Registration)

### Step-by-Step Process:

#### 1.1 User Registration Request
**File**: `OnlineFirPortal.backend/src/routes/auth.ts:139-203`

When a user registers with a password like `"password123"`, here's what happens:

```typescript
// 1. User submits registration data
const { name, email, mobile, password, ... } = req.body;

// 2. Password gets hashed with bcrypt
const { hash, salt } = await hashPassword(password);
```

#### 1.2 Password Hashing Function
**File**: `OnlineFirPortal.backend/src/lib/security.ts:46-55`

```typescript
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  // Generate a random salt (10 rounds)
  const salt = await bcrypt.genSalt(10);
  
  // Hash password with salt (bcrypt automatically includes salt in hash)
  const hash = await bcrypt.hash(password, salt);
  
  return { hash, salt };
}
```

**What actually gets stored in database**:
- `passwordHash`: `"$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"` (60 chars)
- `passwordSalt`: `"someRandomSalt123"` (stored separately but redundant since bcrypt includes it)

#### 1.3 Database Storage
**File**: `OnlineFirPortal.backend/src/lib/db.ts:60-75`

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  mobile TEXT UNIQUE,
  passwordHash TEXT,        -- Store the bcrypt hash
  passwordSalt TEXT,         -- Store the salt (redundant but kept for compatibility)
  mfaEnabled INTEGER DEFAULT 0,
  mfaSecret TEXT,
  -- ... other fields
);
```

**Stored Values Example**:
- `email`: `"user@example.com"`
- `passwordHash`: `"$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"`
- `passwordSalt`: `"a1b2c3d4e5f6g7h8"`

---

## 2. Password Verification (Login)

### Step-by-Step Process:

#### 2.1 User Login Attempt
**File**: `OnlineFirPortal.backend/src/routes/auth.ts:208-305`

```typescript
// 1. User submits email and password
const { email, password } = req.body;

// 2. Find user in database
const user = getUserByIdentifier(email);

// 3. Verify password
const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
```

#### 2.2 Password Verification Function
**File**: `OnlineFirPortal.backend/src/lib/security.ts:52-55`

```typescript
export async function verifyPassword(password: string, storedHash: string, salt?: string): Promise<boolean> {
  // bcrypt.compare automatically extracts salt from stored hash and compares
  return await bcrypt.compare(password, storedHash);
}
```

**What happens internally**:
1. bcrypt extracts the salt from `storedHash` (first 22 chars after `$2a$10$`)
2. Uses that salt to hash the input `password`
3. Compares the resulting hash with `storedHash`
4. Returns `true` if they match, `false` otherwise

---

## 3. Multi-Factor Authentication (MFA)

### Two Types of MFA Implemented:

#### 3.1 Email OTP (Primary MFA)
**File**: `OnlineFirPortal.backend/src/routes/auth.ts:235-266`

```typescript
// 1. Generate 6-digit OTP
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// 2. Store OTP temporarily (expires in 10 minutes)
otpStore.set(user.id, {
  otp: otpCode,
  expires: Date.now() + 10 * 60 * 1000,
  attempts: 0
});

// 3. Send OTP via email
const emailResult = await sendOTPEmail(user.email, otpCode, user.name);
```

#### 3.2 TOTP (Time-based OTP) - Alternative/Backup
**Files**: 
- Backend: `OnlineFirPortal.backend/src/lib/security.ts:263-348`
- Frontend: `OnlineFirPortal.frontend/lib/security.ts:61-135`

```typescript
// Generate TOTP secret during registration
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  for (const byte of array) {
    secret += chars[byte % 32];
  }
  return secret; // e.g., "JBSWY3DPEHPK3PXP"
}

// Verify TOTP token
export async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  // Check current time window and ±1 window (90 seconds total)
  const timeStep = 30;
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor(Date.now() / 1000 / timeStep) + i;
    const code = await computeTOTPCode(secret, counter);
    if (code === token) {
      return true;
    }
  }
  return false;
}
```

---

## 4. JWT Token Management

### After Successful Authentication:

#### 4.1 Token Generation
**File**: `OnlineFirPortal.backend/src/lib/jwt.ts:32-48`

```typescript
// Access Token (15 minutes - short-lived)
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'fir-portal',
    audience: 'fir-portal-users',
  });
}

// Refresh Token (7 days - long-lived)
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'fir-portal',
  });
}
```

#### 4.2 Token Payload Structure
```typescript
interface TokenPayload {
  userId: string;      // "abc-123-def"
  email: string;       // "user@example.com"
  role: string;        // "citizen" | "police" | "admin"
  mfaVerified: boolean; // true after MFA completion
  name?: string;       // "John Doe"
}
```

#### 4.3 Token Storage in Secure Cookies
**File**: `OnlineFirPortal.backend/src/routes/auth.ts:279-292`

```typescript
// Set secure httpOnly cookies
res.cookie('accessToken', accessToken, {
  httpOnly: true,                    // JavaScript can't access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',               // CSRF protection
  maxAge: 15 * 60 * 1000            // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

---

## 5. Data Encryption & Storage

### Two Encryption Systems:

#### 5.1 FIR Data Encryption (AES-256-GCM)
**File**: `OnlineFirPortal.backend/src/lib/db.ts:10-43`

```typescript
// Encryption function (called when FIR is created)
function encryptFIRDataSync(plaintext: string): string {
  const salt = randomBytes(16);                    // Random salt
  const key = scryptSync(FIR_ENCRYPTION_KEY, salt, 32); // Derive key
  const iv = randomBytes(12);                       // Initialization vector

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();              // Authentication tag

  // Combine: salt + iv + authTag + encrypted data
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  return combined.toString('base64');               // Store as Base64
}
```

**What gets encrypted in a FIR**:
```typescript
// All FIR content is encrypted as JSON string
const firData = {
  complainantName: "John Doe",
  incidentDate: "2025-01-15",
  incidentPlace: "Main Street",
  complaintType: "Theft",
  description: "My wallet was stolen...",
  contactInfo: "john@example.com"
};

// This gets encrypted and stored in `firs.encryptedData` field
const encryptedData = encryptFIRDataSync(JSON.stringify(firData));
```

#### 5.2 Document Encryption
**File**: `OnlineFirPortal.backend/src/lib/db.ts:45-51`

```typescript
// Documents are encrypted using the same AES-256-GCM method
function encryptDocumentContentSync(content: string): string {
  return encryptFIRDataSync(content); // Same encryption as FIR data
}
```

---

## 6. Data Decryption & Usage

### Decryption happens on-the-fly when data is accessed:

#### 6.1 FIR Data Decryption
**File**: `OnlineFirPortal.backend/src/lib/db.ts:129-166`

```typescript
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

  // Return decrypted FIR data combined with unencrypted metadata
  return {
    ...data,                    // Decrypted FIR content
    ...fir,                     // Unencrypted FIR metadata
    timeline: mappedTimeline,
    documents
  };
}
```

#### 6.2 When Decryption Occurs:

1. **When a user views their FIR**: `getFIRById()` → `unpackFIR()` → decryption
2. **When police view assigned FIRs**: `getAllFIRs()` → `unpackFIR()` → decryption
3. **When documents are downloaded**: `decryptDocumentContent()` → decryption

**Important**: Data is only decrypted in memory when needed. It's stored encrypted at rest.

---

## 7. Access Control & Authorization

### Role-Based Access Control (RBAC):

#### 7.1 Access Control Matrix
**File**: `OnlineFirPortal.backend/src/lib/access-control.ts:55-77`

```typescript
const ACCESS_CONTROL_MATRIX: Record<UserRole, Record<Resource, Action[]>> = {
  citizen: {
    fir: ['create', 'read'],           // Can create and read own FIRs only
    documents: ['read', 'upload'],      // Can upload docs to own FIRs
    users: ['read', 'update'],          // Can update own profile
    reports: [],                        // No access to reports
    settings: [],                       // No access to settings
  },
  police: {
    fir: ['read', 'update', 'assign'], // Can read all FIRs, update status
    documents: ['read'],                // Can read all documents
    users: ['read'],                    // Can read basic user info
    reports: ['read'],                  // Can view reports
    settings: ['read'],                 // Can read settings
  },
  admin: {
    fir: ['create', 'read', 'update', 'delete', 'assign'], // Full FIR access
    documents: ['read', 'upload', 'delete'],               // Full document access
    users: ['create', 'read', 'update', 'delete'],         // Full user management
    reports: ['read', 'generate'],                          // Can generate reports
    settings: ['read', 'update'],                          // Full settings access
  },
};
```

#### 7.2 Middleware Enforcement
**File**: `OnlineFirPortal.backend/src/lib/auth-middleware.ts:18-57`

```typescript
export async function authenticateToken(req, res, next) {
  try {
    // 1. Extract token from header or cookie
    const authHeader = req.headers['authorization'];
    let token = authHeader?.substring(7) || req.cookies['accessToken'];

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // 2. Verify token
    const user = verifyAccessToken(token);
    if (!user || !user.mfaVerified) {
      return res.status(401).json({ error: 'Invalid or MFA required' });
    }

    // 3. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}
```

#### 7.3 Permission Checking
**File**: `OnlineFirPortal.backend/src/lib/auth-middleware.ts:59-117`

```typescript
export function checkPermission(
  user: TokenPayload,
  resource: Resource,
  action: Action,
  resourceOwnerId?: string
): { allowed: boolean; error?: string } {
  const role = user.role as UserRole;

  // 1. Check basic permission
  if (!hasPermission(role, resource, action)) {
    return { allowed: false, error: 'Access denied' };
  }

  // 2. Ownership check for citizens
  if (role === 'citizen' && resourceOwnerId && resourceOwnerId !== user.userId) {
    return { allowed: false, error: 'You can only access your own resources' };
  }

  // 3. Log the access attempt
  logAccessAttempt({
    timestamp: new Date().toISOString(),
    userId: user.userId,
    userRole: role,
    resource,
    action,
    resourceId: resourceOwnerId || 'unknown',
    allowed: true
  });

  return { allowed: true };
}
```

---

## 8. Digital Signatures

### RSA Digital Signatures for Data Integrity:

#### 8.1 Key Generation
**File**: `OnlineFirPortal.backend/src/lib/security.ts:192-211`

```typescript
export async function generateRSASigningKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',           // Probabilistic Signature Scheme
      modulusLength: 2048,       // Key size
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256'
    },
    true,                        // Exportable
    ['sign', 'verify']
  );

  // Export keys as Base64 strings for storage
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
  };
}
```

#### 8.2 Signing Data
**File**: `OnlineFirPortal.backend/src/lib/security.ts:213-232`

```typescript
export async function signData(data: string, privateKeyBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength: 32 },
    privateKey,
    encoder.encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
```

#### 8.3 Verifying Signatures
**File**: `OnlineFirPortal.backend/src/lib/security.ts:234-253`

```typescript
export async function verifySignature(
  data: string, 
  signatureBase64: string, 
  publicKeyBase64: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const signatureBuffer = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    { name: 'RSA-PSS', saltLength: 32 },
    publicKey,
    signatureBuffer,
    encoder.encode(data)
  );
}
```

---

## 9. Complete Data Flow Example

### User Files a FIR - End-to-End:

1. **Registration**:
   - User registers with password `"MySecurePass123!"`
   - bcrypt generates: `hash="$2a$10$abc..."`, `salt="def..."`
   - Stored in database

2. **Login**:
   - User enters email/password
   - System finds user, verifies password with bcrypt
   - Password matches → proceed to MFA

3. **MFA**:
   - System generates OTP `"123456"`
   - Sends via email
   - User enters OTP → verification successful

4. **JWT Tokens**:
   - System generates access token (15min) + refresh token (7days)
   - Tokens stored in httpOnly cookies

5. **FIR Creation**:
   - User submits FIR data
   - System encrypts entire FIR with AES-256-GCM
   - Encrypted data stored in database

6. **Digital Signature** (optional):
   - User can sign FIR with private RSA key
   - Signature stored alongside encrypted FIR

7. **Access Control**:
   - Each request goes through authentication middleware
   - Token verified, permissions checked
   - Access logged for audit

8. **Data Retrieval**:
   - When user views FIR → decrypted on-the-fly
   - Police/admin access based on role permissions
   - All access attempts logged

---

## 10. Security Best Practices Implemented

### **At Rest**:
- Passwords: bcrypt with salt (industry standard)
- FIR Data: AES-256-GCM encryption
- Documents: Same AES-256-GCM encryption
- Database: SQLite with proper indexes

### **In Transit**:
- JWT tokens for API authentication
- Secure cookies (httpOnly, secure, sameSite)
- HTTPS enforcement in production

### **Access Control**:
- RBAC with 3-tier permission system
- Ownership verification for citizens
- Comprehensive audit logging
- Rate limiting on authentication attempts

### **Multi-Factor**:
- Email OTP (primary)
- TOTP backup (Authenticator apps)
- Session timeout (15 minutes)
- Refresh token rotation

This system implements defense-in-depth with multiple layers of security, ensuring that even if one layer is compromised, other layers continue to protect the data.