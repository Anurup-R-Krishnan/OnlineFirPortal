# Project Structure

A directory and file reference for the OnlineFirPortal repository. This is a
companion to `README.md` and `docs/architecture.md`, which describe behavior
and responsibilities in more depth.

## Root

```
.
├── OnlineFirPortal.backend/        # Express + Prisma API
├── OnlineFirPortal.frontend/       # Next.js application
├── docs/                           # architecture, security, testing, API, deployment, roadmap
├── .github/                        # issue templates, pull request template, CI workflows
├── README.md                       # project overview and quick start
├── PROJECT_STRUCTURE.md            # this file
├── CONTRIBUTING.md                 # contribution guide
├── SECURITY.md                     # security policy and disclosure flow
├── LICENSE                         # MIT license
├── LAB_EVALUATION_MAPPING.md       # lab rubric mapping
├── docker-compose.yml              # backend + frontend + postgres + nginx
├── nginx.conf                      # reverse proxy and TLS configuration
├── backup.sh                       # Postgres backup script
├── monitor.sh                      # health monitoring script
└── .gitignore                      # ignores env files, build output, local DBs
```

Generated and local state (node_modules, `coverage/`, `dist/`, `.next/`,
`.env`, `.env.local`, `*.db`, `*.pem`) is gitignored and never committed.

## Backend (`OnlineFirPortal.backend`)

```
OnlineFirPortal.backend/
├── src/
│   ├── server.ts                   # Express bootstrap, middleware stack, route mounting
│   ├── lib/                        # security, auth, access control, audit, services
│   ├── routes/                     # one module per resource (auth, firs, admin, ...)
│   └── scripts/                    # utility scripts (for example key generation)
├── prisma/
│   ├── schema.prisma               # data model and enums
│   └── migrations/                 # versioned schema migrations
├── data/
│   └── ipc.json                    # IPC reference data used by the IPC routes
├── tests/
│   ├── jest/unit/                  # unit tests (access control, security, totp, ...)
│   ├── jest/integration/           # router-level tests (auth, firs)
│   └── bun/                        # end-to-end tests (auth, fir, stats)
├── .env.example                    # documented environment template
├── Dockerfile
├── package.json                    # scripts, Jest config, MIT license
└── tsconfig.json
```

### `src/lib`

| Module | Responsibility |
| --- | --- |
| `env.ts` | Loads and validates environment configuration. |
| `security.ts` | Encryption, hashing, signatures, login attempt tracking, lockout. |
| `security-middleware.ts` | Helmet, hpp, rate limiters, input sanitization. |
| `auth-middleware.ts` | JWT authentication and role-gate middleware. |
| `access-control.ts` | Role/resource/action policy matrix. |
| `jwt.ts` | Access and refresh token issuance and verification. |
| `totp-service.ts` | TOTP secret generation and verification. |
| `password-service.ts` | Password strength, history, and reset flows. |
| `session-service.ts` | Hashed opaque session tokens. |
| `audit-logger.ts` | Audit event writing and querying. |
| `notification-service.ts` | In-app notifications and the SMS/email provider interface. |
| `prisma.ts`, `db.ts`, `database-connection.ts` | Prisma client setup. |

### `src/routes`

`auth.ts`, `firs.ts`, `admin.ts`, `documents.ts`, `evidence.ts`,
`criminals.ts`, `roster.ts`, `ipc.ts`, `notifications.ts`, `security-lab.ts`.

See `docs/api.md` for the endpoint reference and `docs/architecture.md` for
the responsibility map.

## Frontend (`OnlineFirPortal.frontend`)

```
OnlineFirPortal.frontend/
├── app/                            # Next.js App Router pages
│   ├── page.tsx                    # landing page
│   ├── layout.tsx                  # root layout, manifest, service worker
│   ├── auth/                       # registration, login, MFA
│   ├── dashboard/                  # role-aware dashboard
│   ├── file-fir/                   # citizen FIR filing form
│   ├── my-firs/                    # citizen FIR list
│   ├── track/                      # status tracking
│   ├── police/                     # officer and SHO workspace
│   ├── admin/                      # administration panel
│   ├── documents/                  # document management
│   ├── notifications/              # in-app notifications
│   ├── emergency/                  # emergency guidance
│   ├── guidelines/                 # filing guidelines
│   ├── privacy/                    # privacy policy
│   └── terms/                      # terms of use
├── components/                     # React components, including Radix UI primitives
├── lib/                            # frontend helpers and API clients
├── public/                         # static assets, web manifest, service worker
├── tests/
│   ├── unit/                       # Vitest unit tests
│   ├── components/                 # Vitest component tests
│   └── e2e/                        # Playwright browser tests
├── .env.example                    # documented environment template
├── next.config.mjs                 # rewrites /api/* to the backend base URL
├── playwright.config.ts
├── vitest.config.ts
├── Dockerfile
└── package.json
```

## Documentation (`docs`)

| File | Content |
| --- | --- |
| `docs/architecture.md` | Module and route responsibility maps, data model, frontend routes. |
| `docs/security.md` | Threat model, trust boundaries, crypto details, configuration. |
| `docs/testing.md` | Test suites, what they cover, coverage thresholds, CI. |
| `docs/api.md` | Endpoint reference with methods, paths, and role gates. |
| `docs/deployment.md` | Docker Compose, nginx, TLS, operational scripts. |
| `docs/roadmap.md` | Technical gaps grouped by security, code, deployment, testing, docs. |
| `docs/screenshots/` | Real captures from the running application. |

## Community (`docs` companion at root)

- `README.md` points to the deep pages in `docs/`.
- `.github/ISSUE_TEMPLATE/` provides bug, feature, and security report forms.
- `.github/pull_request_template.md` enforces the contribution checklist.
- `.github/workflows/ci.yml` runs backend tests, frontend checks, and the
  Docker build.

Every file exists for a specific reason in the demonstration of a secure,
civic FIR filing system.
