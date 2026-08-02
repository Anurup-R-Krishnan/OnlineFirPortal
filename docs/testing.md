# Testing

OnlineFirPortal has four test layers: backend Jest unit and integration,
backend Bun end-to-end, frontend Vitest, and frontend Playwright browser
tests. This page explains how to run each suite, what it covers, and what the
coverage configuration actually enforces.

## Backend Jest suite

The Jest suite lives in `OnlineFirPortal.backend/tests/jest` and runs with
`ts-jest`. It exercises real modules and, for the integration tests, the real
Express router backed by an isolated test database.

```bash
cd OnlineFirPortal.backend
npm run test:jest
```

Coverage is collected (`--coverage`) and a global threshold is enforced by the
Jest config:

```json
"coverageThreshold": { "global": { "branches": 15, "functions": 15, "lines": 15, "statements": 15 } }
```

The threshold is intentionally modest. The value of these tests is the
behavior they encode, not a high coverage percentage. Treat any coverage badge
claiming a specific number as unverified unless produced by a local run.

### Unit tests

| File | Covers |
| --- | --- |
| `access-control.test.ts` | The role/resource/action matrix and route gating. |
| `password-service.test.ts` | Password strength rules and history checks. |
| `security.test.ts` | Encryption helpers, hashing, and rate-limit logic. |
| `security-lab.test.ts` | Base64 and key exchange demo helpers. |
| `totp-service.test.ts` | TOTP secret generation and code verification. |

### Integration tests

| File | Covers |
| --- | --- |
| `auth.test.ts` | Registration, login, lockout, and token flows against the router. |
| `firs.test.ts` | FIR create, submit, and list flows with the router and test DB. |

## Backend Bun suite

The Bun suite in `OnlineFirPortal.backend/tests/bun` exercises the full HTTP
lifecycle. It requires Bun to be installed.

```bash
cd OnlineFirPortal.backend
npm run test:bun
```

| File | Covers |
| --- | --- |
| `auth.test.ts` | Complete authentication requests against a running server. |
| `fir.test.ts` | Complete FIR lifecycle requests. |
| `stats.test.ts` | Statistics and aggregate endpoints. |

## Frontend Vitest suite

```bash
cd OnlineFirPortal.frontend
npm test
```

| File | Covers |
| --- | --- |
| `tests/unit/auth-store.test.ts` | Frontend authentication state transitions. |
| `tests/unit/digital-signature.test.ts` | Signature encoding helpers used by the filing form. |
| `tests/components/Sidebar.test.tsx` | Navigation component rendering and active states. |

## Frontend Playwright suite

The end-to-end suite in `OnlineFirPortal.frontend/tests/e2e` drives the real
application across Chromium, Firefox, and WebKit. `playwright.config.ts`
boots the app on port 4000.

```bash
cd OnlineFirPortal.frontend
npx playwright install        # one-time browser download
npx playwright test
```

The e2e suite needs both the frontend (port 4000) and backend (port 4001)
running, or a `webServer` block in `playwright.config.ts` that starts them.

## Type checks and lint

Backend:

```bash
cd OnlineFirPortal.backend && npx tsc --noEmit
```

Frontend:

```bash
cd OnlineFirPortal.frontend && npm run lint && npx tsc --noEmit
```

## CI

`.github/workflows/ci.yml` runs the backend test suite, the frontend
lint/type-check/test/build, and a Docker image build on push to `main` and on
pull requests. All workflows use least-privilege permissions and no secrets.
