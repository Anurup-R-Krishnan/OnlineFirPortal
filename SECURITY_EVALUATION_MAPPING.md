# Security Evaluation Components & Tech Stack Mapping

## Tech Stack Overview

### Backend Technologies
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5.2.1
- **Database**: SQLite3 (better-sqlite3 v12.6.2)
- **Security Libraries**:
  - bcryptjs v3.0.3 (password hashing)
  - jsonwebtoken v9.0.3 (JWT tokens)
  - Web Crypto API (AES-256-GCM, RSA-SHA256)
- **Email Service**: Resend v6.9.1
- **Validation**: Zod v4.3.6

### Frontend Technologies
- **Framework**: Next.js v16.1.6 with React 19.2.0
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS v4.1.9
- **Security**: Web Crypto API in browser
- **Encoding**: QR Code generation (qrcode v1.5.4)

---

## Evaluation Components Implementation Mapping

### 1. Authentication (3 marks)

#### 1.1 Single-Factor Authentication (1.5 marks)
**Technology**: bcryptjs + JWT
**Files**: 
- `OnlineFirPortal.backend/src/lib/security.ts:46-55` - Password hashing with bcrypt
- `OnlineFirPortal.backend/src/routes/auth.ts:208-305` - Login implementation
- `OnlineFirPortal.backend/src/lib/jwt.ts` - JWT token management

**Implementation**:
```typescript
// Password hashing with built-in salt
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}
```

#### 1.2 Multi-Factor Authentication (1.5 marks)
**Technology**: TOTP + Email OTP
**Files**:
- `OnlineFirPortal.backend/src/lib/security.ts:263-348` - TOTP generation/verification
- `OnlineFirPortal.backend/src/routes/auth.ts:235-392` - MFA flow implementation
- `OnlineFirPortal.frontend/lib/security.ts:61-135` - Client-side TOTP

**Implementation**:
```typescript
// TOTP generation with time-based tokens
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  for (const byte of array) {
    secret += chars[byte % 32];
  }
  return secret;
}
```

### 2. Authorization & Access Control (3 marks)

#### 2.1 Access Control Model (1.5 marks)
**Technology**: Role-Based Access Control (RBAC) with ACL
**File**: `OnlineFirPortal.backend/src/lib/access-control.ts:1-77`

**Subjects**: citizen, police, admin (3 roles)
**Objects**: fir, documents, users, reports, settings (5 resources)
**Implementation**:
```typescript
const ACCESS_CONTROL_MATRIX: Record<UserRole, Record<Resource, Action[]>> = {
  citizen: {
    fir: ['create', 'read'], 
    documents: ['read', 'upload'], 
    users: ['read', 'update'], 
    reports: [], 
    settings: [], 
  },
  // ... other roles
};
```

#### 2.2 Policy Implementation (1.5 marks)
**Files**:
- `OnlineFirPortal.backend/src/lib/auth-middleware.ts:18-139` - Middleware implementation
- `OnlineFirPortal.backend/src/lib/access-control.ts:100-226` - Access control functions

**Implementation**:
```typescript
export function checkPermission(
  user: TokenPayload,
  resource: Resource,
  action: Action,
  resourceOwnerId?: string
): { allowed: boolean; error?: string } {
  const role = user.role as UserRole;
  
  if (!hasPermission(role, resource, action)) {
    return { allowed: false, error: `Access denied` };
  }
  
  // Ownership check for citizens
  if (role === 'citizen' && resourceOwnerId && resourceOwnerId !== user.userId) {
    return { allowed: false, error: 'You can only access your own resources' };
  }
  
  return { allowed: true };
}
```

### 3. Encryption (3 marks)

#### 3.1 Key Exchange (1.5 marks)
**Technology**: RSA-OAEP 2048-bit
**File**: `OnlineFirPortal.backend/src/lib/security.ts:124-188`

**Implementation**:
```typescript
export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const encryptionKeyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
  // ... export and return keys
}
```

#### 3.2 Encryption & Decryption (1.5 marks)
**Technology**: AES-256-GCM with PBKDF2 key derivation
**File**: `OnlineFirPortal.backend/src/lib/security.ts:59-122`

**Implementation**:
```typescript
export async function encryptAES(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(plaintext)
  );
  // ... combine salt + iv + encrypted data
}
```

### 4. Hashing & Digital Signature (3 marks)

#### 4.1 Hashing with Salt (1.5 marks)
**Technology**: SHA-256 + Salt for data, bcrypt for passwords
**Files**:
- `OnlineFirPortal.backend/src/lib/security.ts:27-55` - Salted SHA-256
- `OnlineFirPortal.backend/src/lib/security.ts:43-55` - bcrypt password hashing

**Implementation**:
```typescript
export async function hashWithSalt(data: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataWithSalt = encoder.encode(data + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataWithSalt);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
```

#### 4.2 Digital Signature (1.5 marks)
**Technology**: RSA-PSS with SHA-256
**File**: `OnlineFirPortal.backend/src/lib/security.ts:190-253`

**Implementation**:
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

### 5. Encoding Techniques (3 marks)

#### 5.1 Encoding & Decoding (1 mark)
**Technology**: Base64 encoding + QR Code generation
**Files**:
- `OnlineFirPortal.backend/src/lib/security.ts:16-25` - Base64 encoding
- `OnlineFirPortal.frontend/lib/security.ts:7-15` - Frontend Base64
- QR Code support via `qrcode` package

**Implementation**:
```typescript
export function encodeBase64(data: string): string {
  return btoa(unescape(encodeURIComponent(data)));
}

export function decodeBase64(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}
```

#### 5.2 Security Levels & Risks (1 mark - Theory)
**Implementation Areas**:
- OWASP Top 10 considerations in authentication flows
- JWT token security (short-lived access tokens + refresh tokens)
- Input validation using Zod schemas
- Rate limiting on OTP attempts
- Secure cookie configuration

#### 5.3 Possible Attacks (1 mark - Theory)
**Protections Implemented**:
- **Brute Force**: Rate limiting on login attempts, account lockout after 3 OTP failures
- **SQL Injection**: Parameterized queries with SQLite3
- **XSS**: HttpOnly cookies, input sanitization
- **CSRF**: SameSite=strict cookie policy
- **MITM**: HTTPS enforcement in production, secure cookie flags
- **Replay Attacks**: JWT expiration, OTP expiration (10 minutes)

---

## Security Architecture Summary

### Frontend Security
- Client-side key generation for digital signatures
- TOTP generation for MFA setup
- Base64 encoding for data transmission
- Secure token storage in httpOnly cookies

### Backend Security
- Comprehensive authentication with MFA
- Role-based authorization with audit logging
- AES-256-GCM encryption for sensitive data
- RSA-OAEP for key exchange
- Digital signatures for data integrity
- Secure password hashing with bcrypt

### Cross-Cutting Security
- JWT tokens with proper expiration
- Rate limiting and attempt tracking
- Input validation and sanitization
- Secure headers and cookie policies
- Audit logging for access control

This implementation fully satisfies all 5 practical evaluation components with industry-standard security practices and comprehensive coverage of theoretical security considerations.