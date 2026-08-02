# Roadmap

This page lists genuine technical gaps grouped by area. Items are scoped to
what the code currently lacks, not aspirational marketing. The list is ordered
roughly by user and security impact.

## Security

1. **Secret management and key rotation.** JWT signing secrets and the
   AES-256-GCM encryption keys are static per deployment. Integrate a secret
   manager and add a rotation procedure for `JWT_SECRET`,
   `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, and `FIR_ENCRYPTION_KEY`.
2. **Production notification adapters.** The provider interface exists
   (`notification-service.ts`) but the default provider logs to the console.
   Add real SMS and email adapters with retry and failure auditing.
3. **External identity verification.** Aadhaar OTP is generated and checked in
   memory. Replace the mock with a real integration behind a provider
   interface, and never log OTP values in production.
4. **Independent security review.** The codebase has not been audited. A
   review pass should target the crypto boundary, the JWT/session flow, and
   the admin surface.
5. **SAST and secret scanning in CI.** Add a static analysis job and a
   secret-scan step that fails pull requests on findings.

## Code

6. **Postgres and SQLite parity.** The Docker path uses Postgres while local
   development uses SQLite. Cross-test both in CI to prevent drift.
7. **Status transition validation.** The `FIRStatus` enum declares ten states
   but routes actively assign five. Either implement the remaining transitions
   (verification, chargesheet, archive) with explicit guards, or narrow the
   enum to the enforced set. Illegal transitions should be rejected with clear
   errors.
8. **Structured logging.** Replace console logging with structured JSON and
   request IDs to make the audit and monitoring story complete.
9. **Migrations hygiene.** Prisma `db push` is used in development; adopt
   versioned migrations as the source of truth for the schema.

## Deployment

10. **CI for containers.** Add the Docker build to CI (see
    `docs/testing.md`) and pin base image versions.
11. **Health endpoint.** The monitor script checks the root route; a dedicated
    `/api/health` endpoint with dependency status would make monitoring
    meaningful.
12. **Reverse proxy hardening.** The nginx config is minimal. Add reasonable
    timeouts, request size limits, and rate limiting at the edge.

## Testing

13. **Broader e2e coverage.** Playwright covers citizen journeys; extend it to
    the officer, SHO, and admin flows.
14. **Failure-path tests.** Add coverage for tampered ciphertext, invalid
    signatures, illegal status transitions, lockout boundaries, and evidence
    transfer authorization.
15. **Frontend unit coverage.** Only a small set of frontend units is tested;
    add tests for the filing form validation and document upload edge cases.

## Documentation

16. **Screenshots refresh.** Keep the captures under `docs/screenshots/`
    current as the UI changes.
17. **API examples.** Expand `docs/api.md` with concrete request and response
    bodies captured from a running instance.

## Contribution guide

Pick an item, check `CONTRIBUTING.md`, and open a pull request against
`main`. Prefer the security items and the status-transition item first, since
they have the largest impact on the honest behavior of the system.
