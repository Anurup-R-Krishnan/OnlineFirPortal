# API Reference

The Express API mounts every router under `/api`. All protected routes require
a bearer token issued by the login or MFA flow. Role labels below are the
`requireRole` gates read from each route declaration.

Error responses use `{ "error": "<message>" }` with an appropriate status
code (`400` validation, `401` unauthenticated, `403` forbidden, `404` not
found, `409` conflict, `429` rate limited, `500` server error).

## Authentication (`/api/auth`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/setup-mfa-registration` | public | Generate a TOTP secret and QR code at registration time. Body: `email`. |
| POST | `/api/auth/register` | public | Register a citizen. Body: `name`, `email`, `mobile`, `aadhaar`, `password`, `totpCode` (and `mfaSecret` when enrolling). |
| POST | `/api/auth/aadhaar/request` | public | Request a verification OTP for a 12-digit Aadhaar. Mock: the OTP is printed to the server console. |
| POST | `/api/auth/aadhaar/verify` | public | Verify the OTP from the request step. Body: `aadhaar`, `otp`. |
| POST | `/api/auth/login` | public | First login step. Body: `email`, `password`. Enforces lockout; returns a temporary token when MFA is required. |
| POST | `/api/auth/setup-mfa` | authenticated | Generate a TOTP secret and QR for an existing user. |
| POST | `/api/auth/verify-totp-setup` | authenticated | Confirm a TOTP code during MFA enrollment. Body: `totpCode`. |
| POST | `/api/auth/verify-totp` | public (temp token) | Complete login when MFA is enabled. Body: `tempToken`, `totp`. Returns access and refresh tokens. |
| POST | `/api/auth/verify-recovery-code` | public (temp token) | Login fallback with a recovery code. Body: `tempToken`, `recoveryCode`. |
| POST | `/api/auth/forgot-password` | public | Create a password reset request. Body: `email`. Some roles require admin approval. |
| POST | `/api/auth/reset-password` | public | Complete a reset. Body: `token`, `newPassword`. |
| POST | `/api/auth/change-password` | authenticated | Change password. Body: `currentPassword`, `newPassword`. |
| POST | `/api/auth/logout` | authenticated | Revoke the current session. |
| POST | `/api/auth/refresh` | public (refresh token) | Rotate a refresh token for a new access token. Body: `refreshToken`. |
| POST | `/api/auth/keys` | authenticated | Register an RSA public key (used by the security lab). Body: `publicKey`. |
| POST | `/api/auth/register-public-key` | authenticated | Register the RSA public key used for FIR digital signatures. Body: `publicKey`. |

Password rules: minimum 12 characters, at least one uppercase, one lowercase,
one digit, and one special character. Recent password reuse is rejected.

## FIRs (`/api/firs`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/firs` | CITIZEN | Create a FIR. Payload fields are encrypted at rest. With a registered public key and a valid RSA-PSS `signature`, the FIR is created as `SUBMITTED`; otherwise `DRAFT`. |
| POST | `/api/firs/:id/submit` | CITIZEN (owner) | Submit a draft: requires a registered public key and a valid signature. |
| GET | `/api/firs` | authenticated | List FIRs scoped by role: citizens see their own, officers see assigned FIRs, station roles see station FIRs. |
| GET | `/api/firs/stats` | authenticated | Role-scoped counts. |
| GET | `/api/firs/officers` | SHO, ADMIN, SUPER_ADMIN | List assignable officers, scoped to a station. |
| GET | `/api/firs/:id` | authenticated (owner or assigned) | FIR detail with decrypted payload and timeline. |
| POST | `/api/firs/:id/assign` | SHO, ADMIN | Assign a FIR to an officer and set `UNDER_INVESTIGATION`. Body: `officerId`, `station`. |
| POST | `/api/firs/:id/update-status` | OFFICER, SHO, ADMIN | Update status. Valid values: `SUBMITTED`, `UNDER_INVESTIGATION`, `CLOSED`, `REJECTED`. `CLOSED` and `REJECTED` require `remarks`. |
| POST | `/api/firs/:id/notes` | OFFICER, SHO, ADMIN (assigned officer only for OFFICER) | Append an investigation note and timeline entry. Body: `note`. |

## Documents (`/api/documents`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/documents` | authenticated | List the caller's documents. |
| POST | `/api/documents/upload` | authenticated (owner of the FIR) | Upload a document for a FIR. Max 10 MB; allow-listed MIME types; content encrypted at rest. |
| GET | `/api/documents/:id` | owner or authorized | Download a decrypted document. |
| GET | `/api/documents/fir/:firId` | owner or authorized | List documents for a FIR. |
| POST | `/api/documents/:id/verify` | OFFICER, SHO, ADMIN, SUPER_ADMIN | Mark a document verified. |
| DELETE | `/api/documents/:id` | owner or authorized | Delete a document. |

## Evidence (`/api/evidence`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/evidence` | OFFICER, SHO, ADMIN | Record evidence against a FIR. |
| GET | `/api/evidence/fir/:firId` | OFFICER, SHO, ADMIN, CITIZEN (scoped) | List evidence for a FIR. |
| POST | `/api/evidence/:id/transfer` | OFFICER, SHO, ADMIN | Transfer evidence to another handler. |
| GET | `/api/evidence/:id/chain-of-custody` | OFFICER, SHO, ADMIN | Full custody history for an evidence record. |

## Administration (`/api/admin`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/admin/users/create-officer` | ADMIN, SUPER_ADMIN | Create an officer account. |
| POST | `/api/admin/users/create-sho` | ADMIN, SUPER_ADMIN | Create an SHO account. |
| POST | `/api/admin/users/create-admin` | SUPER_ADMIN | Create an admin account. |
| GET | `/api/admin/users` | ADMIN, SUPER_ADMIN, SHO | List users. |
| GET | `/api/admin/users/:id` | ADMIN, SUPER_ADMIN, SHO | User detail. |
| POST | `/api/admin/users/:id/unlock` | ADMIN, SUPER_ADMIN | Unlock a locked account. |
| GET | `/api/admin/password-reset-requests` | ADMIN, SUPER_ADMIN | Pending reset requests. |
| POST | `/api/admin/password-reset-requests/:id/approve` | ADMIN, SUPER_ADMIN | Approve a reset request. |
| GET | `/api/admin/audit-logs` | ADMIN, SUPER_ADMIN | Filtered, paged audit log review. |
| GET | `/api/admin/audit-logs/export` | ADMIN, SUPER_ADMIN | Download the audit trail as JSON. |
| GET | `/api/admin/documents` | ADMIN, SUPER_ADMIN | Document oversight across FIRs. |
| GET | `/api/admin/firs` | ADMIN, SUPER_ADMIN | FIR oversight across the system. |
| GET | `/api/admin/reports/summary` | ADMIN, SUPER_ADMIN | Aggregate report summary. |
| GET | `/api/admin/settings` | ADMIN, SUPER_ADMIN | Read system settings. |
| POST | `/api/admin/settings` | SUPER_ADMIN | Update system settings. |

## Station modules

Criminals (`/api/criminals`, all OFFICER, SHO, ADMIN):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/criminals?query=` | Search criminals by name, marks, or mobile. |
| POST | `/api/criminals` | Create a criminal profile. |
| POST | `/api/criminals/:id/link-fir` | Link a criminal to a FIR with an involvement type. |

Roster (`/api/roster`):

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/roster?date=&station=` | SHO, ADMIN | Current duty roster. |
| POST | `/api/roster/shift` | SHO, ADMIN | Assign a duty shift to an officer. |
| POST | `/api/roster/status` | OFFICER, SHO | Update duty status, location, and activities. |

## IPC reference (`/api/ipc`, public)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/ipc/search?q=&chapter=&limit=` | Search IPC sections by title or description. |
| GET | `/api/ipc/chapters` | List chapters. |
| GET | `/api/ipc/section/:section` | Section detail. |

## Notifications (`/api/notifications`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/notifications` | authenticated | Latest 50 notifications for the user. |
| POST | `/api/notifications/read-all` | authenticated | Mark all notifications read. |

## Security lab (`/api/security-lab`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/security-lab/access-control-matrix` | authenticated | Return the role/resource/action matrix. |
| POST | `/api/security-lab/encoding/base64` | authenticated | Base64 encode/decode demo. Body: `mode`, `value`. |
| POST | `/api/security-lab/key-exchange/demo` | authenticated | RSA key exchange demo against a registered public key. Body: optional `message`. |
