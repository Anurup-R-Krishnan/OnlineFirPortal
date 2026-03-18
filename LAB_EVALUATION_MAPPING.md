# Lab Evaluation Mapping

This project now covers the lab rubric with implemented backend and frontend features.

## 1. Authentication

- Single-factor authentication:
  `POST /api/auth/login` validates email/mobile and password.
- Multi-factor authentication:
  TOTP setup and verification are implemented in `OnlineFirPortal.backend/src/routes/auth.ts` through:
  `POST /api/auth/setup-mfa-registration`
  `POST /api/auth/verify-totp`
  `POST /api/auth/verify-totp-setup`
- NIST-style flow:
  Registration, password policy, MFA enrollment, session issuance, lockout, and recovery codes are enforced in the auth flow.

## 2. Authorization / Access Control

- Access control matrix and ACL:
  `OnlineFirPortal.backend/src/lib/access-control.ts`
- Programmatic enforcement:
  `OnlineFirPortal.backend/src/lib/auth-middleware.ts`
  `OnlineFirPortal.backend/src/routes/firs.ts`
  `OnlineFirPortal.backend/src/routes/admin.ts`
  `OnlineFirPortal.backend/src/routes/documents.ts`
- Rubric-ready matrix endpoint:
  `GET /api/security-lab/access-control-matrix`

## 3. Encryption

- Encryption and decryption:
  AES-256-GCM in `OnlineFirPortal.backend/src/lib/security.ts`
- Key exchange mechanism:
  Hybrid RSA/AES demonstration in `POST /api/security-lab/key-exchange/demo`
- Sensitive FIR payload encryption:
  `encryptedData` field is populated during FIR creation in `OnlineFirPortal.backend/src/routes/firs.ts`

## 4. Hashing and Digital Signature

- Hashing with salt:
  Password hashing via bcrypt salt in `OnlineFirPortal.backend/src/lib/security.ts`
- Digital signature:
  RSA-PSS signing and verification in:
  `OnlineFirPortal.backend/src/lib/security.ts`
  `OnlineFirPortal.frontend/lib/digital-signature.ts`
  `OnlineFirPortal.backend/src/routes/firs.ts`

## 5. Encoding

- Base64 encoding and decoding helpers:
  `OnlineFirPortal.backend/src/lib/security.ts`
  `OnlineFirPortal.frontend/lib/security.ts`
- Explicit encoding demo endpoint:
  `POST /api/security-lab/encoding/base64`
- Base64 is also used in the FIR receipt/QR payload flow in `OnlineFirPortal.frontend/app/file-fir/page.tsx`

## Verification

- Unit tests:
  `OnlineFirPortal.backend/tests/jest/unit/access-control.test.ts`
- Integration tests:
  `OnlineFirPortal.backend/tests/jest/integration/security-lab.test.ts`
