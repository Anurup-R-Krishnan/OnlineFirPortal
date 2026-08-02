# Security Policy

## Status

OnlineFirPortal is **research and demonstration software**. It is not deployed
public infrastructure and has not undergone an independent security audit.
Treat it as an implementation reference, not a production system.

## What this project protects

The codebase demonstrates the following security controls (see `docs/security.md`
for the full threat model):

- **Authentication:** JWT access and refresh tokens, TOTP multi-factor
  enrollment (speakeasy), account lockout after repeated failed logins, and
  rate limiting on authentication endpoints.
- **Authorization:** role-based access control (`CITIZEN`, `OFFICER`, `SHO`,
  `ADMIN`, `SUPER_ADMIN`) enforced through `src/lib/access-control.ts` and
  `src/lib/auth-middleware.ts`.
- **Data at rest:** AES-256-GCM encryption of sensitive FIR payloads and
  uploaded documents; RSA-PSS digital signatures for FIR receipts.
- **Audit trail:** every protected action is recorded in the `AuditLog` table
  via `src/lib/audit-logger.ts`.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through the GitHub Security
Advisory flow for this repository:

`https://github.com/Anurup-R-Krishnan/OnlineFirPortal/security/advisories`

Guidelines:

- Do **not** open a public issue or pull request for a security problem.
- Include a minimal reproduction: affected endpoint or file, the version, the
  steps to trigger the issue, and the impact you observed.
- Allow the maintainers reasonable time to respond before any public
  disclosure.

You will be acknowledged for valid, first-time reports.

## What is out of scope

- Credentials that are used with **local, non-production** deployments.
- Issues that require already-compromised secrets (the app assumes secrets
  are managed out of band).
- General hardening suggestions without a demonstrated impact.

## Repository hygiene

- `.env` files are ignored and must never be committed. Copy
  `OnlineFirPortal.backend/.env.example` and `OnlineFirPortal.frontend/.env.example`
  to local env files and fill in unique values.
- Local SQLite databases (`*.db`) and coverage/build output are ignored.
- If you find a committed secret, report it via the advisory flow above and
  rotate the value immediately.
