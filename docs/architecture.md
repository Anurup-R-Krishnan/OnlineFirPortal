# Architecture

This document maps every module and route to its responsibility. It is the
deep companion to the root `README.md`.

## Backend modules (`OnlineFirPortal.backend/src/lib`)

| Module | Responsibility |
| --- | --- |
| `env.ts` | Loads configuration from the environment with `dotenv-safe`; fails fast on missing secrets. Exposes `jwtSecret`, `jwtRefreshSecret`, `encryptionKey`, `firEncryptionKey`, `port`, `corsOrigin`. |
| `server.ts` | Express bootstrap: security middleware stack, CORS allow-list, body parsing, and route mounting. |
| `security.ts` | AES-256-GCM encrypt/decrypt, Base64 helpers, bcrypt password hashing and verification, login attempt tracking, account lockout, rate limiting for the security lab, FIR number generation, RSA-PSS signature verification. |
| `security-middleware.ts` | Global `helmet` headers, HTTP parameter pollution guard (`hpp`), `express-rate-limit` instances for the API and for auth routes, and recursive input sanitization. |
| `auth-middleware.ts` | `authenticateToken` extracts and verifies the JWT from the Authorization header or cookie; `requireRole` enforces role gates; object-level ownership checks. |
| `access-control.ts` | The role/resource/action policy matrix (`hasPermission`, `canAccessRoute`) and access-attempt logging. |
| `jwt.ts` | Issues and verifies short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days) with separate signing secrets. |
| `totp-service.ts` | Generates TOTP secrets and QR codes for authenticator apps, verifies codes with a 30-second drift window, and generates 10 recovery codes. |
| `password-service.ts` | Password strength validation, password history, and password reset request/approval/verification flows. |
| `session-service.ts` | Opaque session tokens stored as SHA-256 hashes, with a 7-day expiry and cleanup. |
| `audit-logger.ts` | `logAudit` writes a structured entry for every protected action; `queryAuditLogs` supports filtered paged review. |
| `notification-service.ts` | Persists in-app notifications and provides a provider interface for SMS/email; the default provider is a console mock. |
| `prisma.ts` / `db.ts` / `database-connection.ts` | Prisma client creation, including a configurable database path used by tests. |

## Backend routes (`OnlineFirPortal.backend/src/routes`)

| Module | Responsibility | Role gate |
| --- | --- | --- |
| `auth.ts` | Registration (with mock Aadhaar OTP), login, MFA setup and verify, recovery codes, password reset and change, token refresh, logout, public key registration. | public + authenticated |
| `firs.ts` | FIR create, submit, list, get, stats, officer list, assign, status update, investigation notes. | citizen + officer workflow |
| `admin.ts` | Create officer/SHO/admin accounts, user list and detail, unlock, password reset approvals, audit log query and export, document and FIR oversight, reports, settings. | ADMIN, SUPER_ADMIN |
| `documents.ts` | Upload (10 MB cap, MIME allow-list, encrypted), list, download, verify, delete. | authenticated + role |
| `evidence.ts` | Create evidence, list for a FIR, transfer between handlers, chain of custody history. | OFFICER, SHO, ADMIN |
| `criminals.ts` | Search, create, and link criminals to FIRs. | OFFICER, SHO, ADMIN |
| `roster.ts` | Current duty roster, shift assignment, duty status updates. | SHO, ADMIN (officer shift self-service) |
| `ipc.ts` | IPC section search, chapter list, section detail from `data/ipc.json`. | public |
| `notifications.ts` | List notifications and mark all read. | authenticated |
| `security-lab.ts` | Base64 encode/decode demo and RSA key exchange demo. | authenticated |

## Data model (`OnlineFirPortal.backend/prisma/schema.prisma`)

Core entities and their purpose:

- **User** with role, MFA state, lockout fields, and an optional registered RSA
  public key for FIR signing.
- **FIR** with an AES-256-GCM encrypted payload, status, assigned officer and
  station, and lifecycle timestamps.
- **Document** with encrypted content, verification state, size and MIME type.
- **Timeline** entries on every FIR lifecycle event.
- **Evidence** and **ChainOfCustody** records tracking every custody transfer.
- **Criminal** and the **CriminalFir** join table linking suspects to cases.
- **DutyShift** for the roster.
- **AuditLog** recording actor, action, resource, IP, user agent, result, and
  a JSON change diff.
- **Session** with hashed opaque tokens, **PasswordResetToken** with expiry and
  admin approval, **MfaRecoveryCode** with a consumed flag.
- **Notification** for in-app delivery and delivery status.

The `FIRStatus` enum declares `DRAFT`, `SUBMITTED`, `VERIFIED`, `ASSIGNED`,
`UNDER_INVESTIGATION`, `INVESTIGATION`, `CHARGESHEET`, `CLOSED`, `REJECTED`,
`ARCHIVED`. Current routes assign `DRAFT`, `SUBMITTED`, `UNDER_INVESTIGATION`,
`CLOSED`, and `REJECTED`; the remaining values are reserved by the schema.

## Frontend (`OnlineFirPortal.frontend`)

Next.js App Router pages under `app/`:

| Route | Purpose |
| --- | --- |
| `/` | Landing page with hero, services, how-it-works, and FAQ. |
| `/auth` | Registration and login, including MFA enrollment and recovery codes. |
| `/dashboard` | Role-aware dashboard. |
| `/file-fir` | The citizen FIR filing form with draft support and document upload. |
| `/my-firs` | A citizen's own FIRs with status. |
| `/track` | FIR status tracking by reference. |
| `/police` | Officer and SHO workspace. |
| `/admin` | Administration panel. |
| `/documents` | Document management. |
| `/notifications` | In-app notification center. |
| `/emergency` | Emergency guidance. |
| `/guidelines` | Filing guidelines. |
| `/privacy`, `/terms` | Static policy pages. |

Shared UI lives in `components/` (Radix UI primitives under `components/ui`),
and the app registers a web manifest and service worker from `public/`.
All `/api/*` calls from the browser are rewritten by `next.config.mjs` to the
backend base URL.
