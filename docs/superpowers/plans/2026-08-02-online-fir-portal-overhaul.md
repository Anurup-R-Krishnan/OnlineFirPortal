# OnlineFirPortal Public-Interest Overhaul - Implementation Plan

> **For agentic workers:** execute this plan task-by-task with `superpowers:executing-plans` (inline - no subagents). Steps use checkbox (`- [ ]`) syntax for tracking. Push to `origin/main` after each task's commit (user approved).

**Goal:** Transform the `Anurup-R-Krishnan/OnlineFirPortal` repository into a civic-safety flagship: TrustLine-depth documentation, real screenshots, MIT license, CI, security policy, maintenance templates, repo hygiene (untrack generated artifacts and the `.env`), and accurate GitHub metadata - while removing every unsupported claim. This plan covers **this repo only**. No other repository, no GitHub profile changes.

**Architecture (of the work):** A sequence of independent, reviewable commits grouped by the shared commit categories. Each task ends with a verifiable state and one commit pushed to `main`. The codebase is not being rearchitected; the deliverable is documentation depth, hygiene, security posture, automated verification, and honest framing.

**Tech Stack (in repo):** Backend = Node 20 / Express 5 / TypeScript / Prisma (SQLite local, Postgres in Docker) / JWT + TOTP (speakeasy) / AES-256-GCM + RSA-PSS. Frontend = Next.js 16 / React 19 / Tailwind 4 / Radix / Vitest + Playwright. Ops = Docker Compose, nginx.

## Global Constraints

These apply to every task; do not violate them.

- **Scope:** only this repository. Never touch TrustLine, SecureMed, MisinformationCascade, API-LARP, FocusBoard, the GitHub profile repo, or any other repo.
- **Author identity:** commits authored as `Anurup R Krishnan <anuruprkrishnan@gmail.com>`. Set this **repo-local** in Task 0 (`git config user.name`/`user.email`); do not modify the user's global config. Verify with `git config user.name` → `Anurup R Krishnan`.
- **No AI attribution, anywhere:** no "Generated-by", no "Co-authored-by: Claude/AI", no AI tags in READMEs, docs, commit messages, or code. No em-dashes (`-`) in any delivered content.
- **No fabricated evidence:** no AI-generated images, no fake screenshots, no invented test results, no backdated timestamps, no empty/one-line commits.
- **Remove unsupported claims:** delete or replace "production-ready", "military-grade", "government-grade", "70%+ coverage", "Overall Completion: 100%", "coverage-70%+-green" badge, and any claim not verifiable in this repo.
- **Verified commands only:** never document a command that has not been run successfully in this session. Where a command is stated, it must have been validated (Task 10 re-validates from a clean clone).
- **Real screenshots only:** captured from the running app (user approved running the app locally). If the app cannot start, document the blocker honestly and defer screenshots - never fabricate.
- **MIT license:** add root `LICENSE` (MIT, holder "Anurup R Krishnan"). Set backend `package.json` `license` to `"MIT"`. Frontend `package.json` stays `"private": true` (no license field needed).
- **Least-privilege CI:** every workflow uses `permissions: contents: read` (or narrower). No secrets in workflows.
- **Preserve history:** do not rewrite or rebase existing commits. `git rm --cached` only (files stay on disk).
- **Commit messages:** plain, conventional-prefixed messages only. **No co-author trailers of any kind** (including `Co-Authored-By: Claude`) - the user explicitly forbids AI attribution.

---

## Task 0: Repo-local identity + commit plan doc

**Files:**
- Create: `docs/superpowers/plans/2026-08-02-online-fir-portal-overhaul.md` (copy of this plan)
- Modify: none (config only)

- [ ] **Step 1: Set repo-local git identity**
  ```bash
  git config user.name "Anurup R Krishnan"
  git config user.email "anuruprkrishnan@gmail.com"
  git config user.name && git config user.email
  ```
  Expected: both values print correctly. Do not touch global config.

- [ ] **Step 2: Copy this plan into the repo** (so the plan is versioned where execution happens)
  ```bash
  mkdir -p docs/superpowers/plans
  cp "/home/anuruprkris/.claude/profiles/everything-no-antigravity-claude/plans/elegant-drifting-lantern.md" docs/superpowers/plans/2026-08-02-online-fir-portal-overhaul.md
  ```

- [ ] **Step 3: Commit + push**
  ```bash
  git add docs/superpowers/plans/2026-08-02-online-fir-portal-overhaul.md
  git commit -m "docs: add overhaul implementation plan"
  git push origin main
  ```
  Verify: `git log --oneline -1` shows the commit; push succeeds.

---

## Task 1: Hygiene - untrack generated artifacts, strengthen ignores

**Files:**
- Modify: `.gitignore`, `OnlineFirPortal.backend/.gitignore`
- Untrack (cached only): `OnlineFirPortal.backend/node_modules/`, `OnlineFirPortal.backend/coverage/`, `OnlineFirPortal.backend/dist/`, `OnlineFirPortal.backend/data/`, `OnlineFirPortal.backend/prisma/dev.db`, `OnlineFirPortal.frontend/tsconfig.tsbuildinfo` (confirm existence of each tracked path first)

- [ ] **Step 1: Enumerate exactly what is tracked**
  ```bash
  git ls-files | grep -E 'backend/(node_modules|coverage|dist|data)/|dev\.db|tsbuildinfo' | sed -E 's#(OnlineFirPortal.backend/node_modules/[^/]+/[^/]+/).*#\1#' | sort | uniq -c | sort -rn | head
  git ls-files | grep -cE 'backend/(node_modules|coverage|dist|data)/|dev\.db|tsbuildinfo'
  ```
  Record the exact top-level tracked artifact paths. Expect node_modules ≈ 13,955, coverage ≈ 29, dist/data/dev.db small, `frontend/tsconfig.tsbuildinfo` if tracked.

- [ ] **Step 2: Untrack artifacts (keep on disk)**
  ```bash
  git rm -r --cached OnlineFirPortal.backend/node_modules OnlineFirPortal.backend/coverage OnlineFirPortal.backend/dist OnlineFirPortal.backend/data
  git rm --cached OnlineFirPortal.backend/prisma/dev.db
  git rm --cached OnlineFirPortal.frontend/tsconfig.tsbuildinfo   # only if tracked
  ```

- [ ] **Step 3: Strengthen root `.gitignore`** - append (only if not already present):
  ```gitignore
  # Generated / local state
  *.tsbuildinfo
  *.db
  *.db-journal
  *.pem
  OnlineFirPortal.backend/data/
  .claude/
  ```
  Keep existing `node_modules/`, `dist/`, `.next/`, `coverage/`, `.env*` patterns (they already match nested paths). Confirm `.next/` matches `OnlineFirPortal.frontend/.next/` (a bare `pattern/` in gitignore matches at any depth - yes).

- [ ] **Step 4: Ensure `.env.example` stays trackable in backend** - append `!.env.example` to `OnlineFirPortal.backend/.gitignore` (its `.env.*` rule currently ignores it).

- [ ] **Step 5: Verify**
  ```bash
  git ls-files | grep -cE 'backend/(node_modules|coverage|dist|data)/|dev\.db|tsbuildinfo'   # → 0
  git status --short | head -30
  ```
  Working tree still has node_modules on disk (untracked) - required so tests/builds can run without reinstall.

- [ ] **Step 6: Commit + push**
  ```bash
  git add .gitignore OnlineFirPortal.backend/.gitignore
  git commit -m "chore: clean generated artifacts and repository ignores"
  git push origin main
  ```

---

## Task 2: Security - untrack `.env`, document env examples, add SECURITY.md

**Files:**
- Untrack (cached only): `OnlineFirPortal.backend/.env`
- Modify: `OnlineFirPortal.backend/.env.example` (field-level docs)
- Create: `OnlineFirPortal.frontend/.env.example`, `SECURITY.md`

- [ ] **Step 1: Confirm `.env` contents are non-secret before untracking** (already audited: only `API_RATE_LIMIT_MAX` and `CUSTOM_RATE_LIMIT_MAX`, numeric). Record in report: **no live secrets, no rotation required**.
  ```bash
  awk -F= '{print $1}' OnlineFirPortal.backend/.env
  ```
- [ ] **Step 2: Untrack it**
  ```bash
  git rm --cached OnlineFirPortal.backend/.env
  ```

- [ ] **Step 3: Rewrite `OnlineFirPortal.backend/.env.example` with a comment per variable** - document each key, type, default, and where it is consumed (source: `OnlineFirPortal.backend/src/lib/env.ts`). Cover: `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `DATABASE_PATH`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `FIR_ENCRYPTION_KEY`, `API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`, `CUSTOM_RATE_LIMIT_WINDOW_MS`, `CUSTOM_RATE_LIMIT_MAX`. Mark every secret value as `replace-with-a-...` placeholder. Add a note: `DATABASE_URL=file:./dev.db` for local SQLite; Postgres URL for Docker.

- [ ] **Step 4: Create `OnlineFirPortal.frontend/.env.example`** - document `NODE_ENV`, `PORT=4000`, and optional `NEXT_PUBLIC_API_URL` (the client uses relative `/api` via Next rewrites; confirm against `next.config.mjs` and document the base-URL mechanism accurately).

- [ ] **Step 5: Create `SECURITY.md`** with: responsible-disclosure contact path, what is protected (auth, evidence, audit), where the threat model lives (`docs/security.md`, Task 5), how to report a vulnerability, and a statement that this is research/demonstration software, not deployed public infrastructure.

- [ ] **Step 6: Verify**
  ```bash
  git ls-files | grep -E '(^|/)\.env'    # only OnlineFirPortal.backend/src/lib/env.ts
  git ls-files | grep -E '\.env\.example'   # backend + frontend present
  git status --short | grep -i env
  ```
- [ ] **Step 7: Commit + push**
  ```bash
  git add -A
  git commit -m "security: remove unsafe configuration and document trust boundaries"
  git push origin main
  ```

---

## Task 3: Licensing + maintenance templates

**Files:**
- Create: `LICENSE` (MIT, `Copyright (c) 2026 Anurup R Krishnan`), `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/ISSUE_TEMPLATE/security_report.md`, `.github/pull_request_template.md`
- Modify: `OnlineFirPortal.backend/package.json` (`"license": "ISC"` → `"MIT"`)

- [ ] **Step 1: Write the MIT `LICENSE`** (standard MIT text, current year, holder `Anurup R Krishnan`).
- [ ] **Step 2: Write `CONTRIBUTING.md`** - how to set up, run tests, branch/PR flow, commit conventions (conventional prefixes, no AI attribution), code-of-conduct note.
- [ ] **Step 3: Write the three issue templates + PR template** (concise forms: bug report with repro steps + environment; feature request with motivation/scope; security report pointing to SECURITY.md; PR template with checklist).
- [ ] **Step 4: Update backend `package.json` license field**; also set root-friendly `"description"` (short, accurate: "Accessible online FIR filing platform with evidence integrity, MFA, audit trails, and role-based police workflows.") and add `"private": false`? - leave as-is except license + description.
- [ ] **Step 5: Verify** - `grep '"license"' OnlineFirPortal.backend/package.json` → `"MIT"`; all template files exist.
- [ ] **Step 6: Commit + push**
  ```bash
  git add -A
  git commit -m "chore: add licensing and maintenance templates"
  git push origin main
  ```

---

## Task 4: Root README rewrite (TrustLine depth)

**Files:**
- Rewrite: `README.md`

Write the README with the following structure (recruiter-scannable; deep tables go to `docs/` in Task 5). Every claim must be backed by the codebase. **No em-dashes. No AI attribution. No fake badges.** Use only real badges (MIT license, repo topics) or none.

**Required sections:**
1. **Title + one-sentence value proposition** - accessible 24/7 FIR filing where citizens gain a trackable reporting path and police workflows keep evidence integrity, privacy, auditability, and controlled access. No "military-grade".
2. **The problem (public-interest framing)** - citizens need an accessible reporting channel; law enforcement requires evidence integrity, role-limited access, and an auditable trail. This project demonstrates a full implementation of both.
3. **What it is (verified scope) + explicit limitations** - honest list (research/demonstration software; local SQLite vs Postgres drift; no production SMS/email adapters; not deployed public infrastructure).
4. **Roles & responsibilities** - `CITIZEN`, `OFFICER`, `SHO`, `ADMIN`, `SUPER_ADMIN` (from `prisma/schema.prisma`) with a **Mermaid role model** (users → roles → allowed actions).
5. **System architecture** - backend (Express + Prisma + lib modules), frontend (Next.js app routes), shared trust boundary. **Mermaid deployment/architecture diagram** (browser → Next frontend → Express API → Prisma → DB; nginx + Docker).
6. **FIR submission & investigation lifecycle** - the `FIRStatus` enum (`DRAFT → SUBMITTED → VERIFIED → ASSIGNED → UNDER_INVESTIGATION/INVESTIGATION → CHARGESHEET → CLOSED/REJECTED/ARCHIVED`) as a **Mermaid state diagram**, with the actor at each transition.
7. **Authentication & authorization boundaries** - JWT access + refresh, TOTP MFA enrollment, 5-attempt lockout / 30-minute lock, rate limiting, RBAC via `src/lib/access-control.ts` + `auth-middleware.ts`. **Mermaid trust-boundary diagram**.
8. **Evidence upload & cryptographic integrity** - AES-256-GCM encryption of FIR payloads and documents, RSA-PSS digital signatures, password hashing with salt (bcrypt), Base64 handling. **Mermaid evidence flow** (`COLLECTED → IN_CUSTODY → IN_TRANSIT → IN_LAB → IN_COURT → DISPOSED/RETURNED`).
9. **Audit trail & accountability** - `AuditLog` model + `audit-logger.ts`, the `AuditAction` enum categories.
10. **Threat model** - a compact table (asset, threat, control) pointing to `docs/security.md`.
11. **API overview** - key endpoint groups (`/api/auth/*`, `/api/firs`, `/api/evidence`, `/api/documents`, `/api/admin`, `/api/security-lab`, `/api/criminals`, `/api/roster`, `/api/ipc`, `/api/notifications`) from `src/routes/*`.
12. **Tech stack** - accurate table (runtime, framework, ORM, DB, crypto, frontend).
13. **Repository structure** - short tree pointing to `docs/architecture.md` for depth.
14. **Quick start (validated commands)** - backend: `npm ci`, `npx prisma generate`, copy `.env.example` → `.env`, `npm run dev` (port 4001); frontend: `npm ci`, `npm run dev` (port 4000). Each command must be run successfully before writing it (validate in Task 6/10).
15. **Tests** - validated commands (backend jest + bun, frontend vitest + Playwright) and a **verified test matrix** (table of the actual test files: `tests/jest/unit/{access-control,password-service,security,security-lab,totp-service}.test.ts`, `tests/jest/integration/{auth,firs}.test.ts`, `tests/bun/{auth,fir,stats}.test.ts`, frontend `tests/{unit,components,e2e}`).
16. **Docker deployment** - `docker compose up` (document: backend+frontend+postgres+nginx; note certs `cert.pem`/`key.pem` must be provided).
17. **Screenshots** - real screenshots wired in (added in Task 6; until then keep the section pointing to the task path and do not claim screenshots exist).
18. **Limitations & non-goals** - explicit and honest (see section 3).
19. **Roadmap** - real technical gaps only (secret management, real notification adapters, Postgres/SQLite parity, key rotation, production audit, broader e2e coverage).
20. **Contributing / License / Security** - point to `CONTRIBUTING.md`, `LICENSE`, `SECURITY.md`.

- [ ] **Step 1: Draft the README** following the outline. Verify every section against the code (re-open schema enums, `src/lib/*`, `src/routes/*`, package.json scripts).
- [ ] **Step 2: Self-review** - no em-dashes (`grep -n '-' README.md` → nothing), no banned phrases (`production ready|military|100%|government-grade|coverage-70`), all Mermaid blocks syntactically valid, all command claims already run, all links resolve.
- [ ] **Step 3: Commit + push**
  ```bash
  git add README.md
  git commit -m "docs: rewrite project documentation and architecture"
  git push origin main
  ```

---

## Task 5: Supporting `docs/` pages + PROJECT_STRUCTURE refresh

**Files:**
- Create: `docs/architecture.md`, `docs/security.md`, `docs/testing.md`, `docs/api.md`, `docs/deployment.md`, `docs/roadmap.md`
- Modify: `PROJECT_STRUCTURE.md` (fix stale references to `DEPLOYMENT.md`, `SECURITY_EVALUATION.txt`, `SECURITY_WORKFLOW_EXPLAINED.md`, `testing_guide.md`, and `/docs` - none exist; point to the new `docs/` instead)

- [ ] **Step 1: `docs/architecture.md`** - module/service responsibility map: every `src/lib/*` and `src/routes/*` file with one-line responsibility, the Prisma data model (User, FIR, Document, AuditLog, Evidence, ChainOfCustody, Criminal, DutyShift), frontend `app/*` routes.
- [ ] **Step 2: `docs/security.md`** - full threat model (asset/threat/control table), trust boundaries, crypto details (AES-256-GCM, RSA-PSS, bcrypt, TOTP), auth flows, rate-limit config, lockout policy.
- [ ] **Step 3: `docs/testing.md`** - how to run each suite, the test matrix, what each test covers, note on coverage thresholds.
- [ ] **Step 4: `docs/api.md`** - API reference derived from `src/routes/*` (method, path, auth role, request/response shape where determinable from code).
- [ ] **Step 5: `docs/deployment.md`** - Docker Compose services, `nginx.conf`, `backup.sh`, `monitor.sh`, TLS cert note.
- [ ] **Step 6: `docs/roadmap.md`** - technical debt grouped by security/code/deployment/testing/docs + a genuine contribution roadmap.
- [ ] **Step 7: Refresh `PROJECT_STRUCTURE.md`** - correct the root file list (remove references to files that don't exist), add `docs/` and `.github/`.
- [ ] **Step 8: Verify** - all README links to `docs/*.md` resolve; `grep -rn '-' docs/` → none; no banned phrases.
- [ ] **Step 9: Commit + push**
  ```bash
  git add -A
  git commit -m "docs: add architecture and operational guides"
  git push origin main
  ```

---

## Task 6: Real application screenshots

**Files:**
- Create: `docs/screenshots/*.png` (from the running app)
- Modify: `README.md` (wire screenshots into the Screenshots section)
- May modify: `OnlineFirPortal.frontend/next.config.mjs` (only if it lacks `output: "standalone"`, which the Dockerfile requires - verify first)

- [ ] **Step 1: Prepare local run env** (all gitignored): create `OnlineFirPortal.backend/.env` from `.env.example` with local values (`DATABASE_URL=file:./dev.db`, `PORT=4001`, dev secrets). Frontend runs on port 4000.
- [ ] **Step 2: Database** - `npx prisma generate` then `npx prisma db push` (SQLite `dev.db` already on disk; push updates schema).
- [ ] **Step 3: Start backend** - `npm run dev` (or `npm start`) in background on port 4001; confirm `curl localhost:4001/health` or a known route responds.
- [ ] **Step 4: Start frontend** - `npm run dev` in background on port 4000; confirm it serves.
- [ ] **Step 5: Seed a demo dataset** - register a citizen via the UI/API and (if reachable via API) create an officer/SHO/admin account; add one FIR with evidence so the lifecycle screens show real data.
- [ ] **Step 6: Capture screenshots with Playwright** (already a devDependency) - write a small script under `scripts/` or `/tmp` that visits and screenshots: home/landing, citizen file-FIR form, my-FIRs / track status, citizen dashboard, officer dashboard, admin panel. Save to `docs/screenshots/`. Keep the capture script out of the repo (gitignored) or in `docs/` if useful.
- [ ] **Step 7: View each screenshot** - confirm they render the real app (not errors/blank). Re-capture any that show errors.
- [ ] **Step 8: Wire into README** - replace the placeholder Screenshots section with the real images.
- [ ] **Fallback (only if the app cannot start within reasonable effort):** stop, document the exact blocker, and mark screenshots as a deferred follow-up. Do **not** fabricate or reuse `public/placeholder.*`.
- [ ] **Step 9: Commit + push**
  ```bash
  git add -A
  git commit -m "docs: add authentic screenshots and operational guides"
  git push origin main
  ```

---

## Task 7: Boundary & failure-path test coverage

**Files:**
- Create/Modify: `OnlineFirPortal.backend/tests/jest/**` (new tests only where a real gap exists)

First inspect the existing tests to avoid duplicates. Add only tests that encode a real failure boundary and that pass against the real code. Candidates (verify each against source before writing):

- [ ] **Step 1: Inspect existing coverage** - read `tests/jest/unit/{access-control,password-service,security,totp-service}.test.ts` and integration tests. Note which boundaries are already covered.
- [ ] **Step 2: Candidate A - invalid role/privilege escalation:** `access-control.ts` rejects a `CITIZEN` performing an `SHO`-only action; unknown role rejected.
- [ ] **Step 3: Candidate B - TOTP failure:** `totp-service.ts` rejects an invalid/expired code (if the service exposes verification).
- [ ] **Step 4: Candidate C - tampered ciphertext:** `security.ts` AES-256-GCM decryption fails on a modified ciphertext (auth-tag failure) rather than returning corrupt plaintext.
- [ ] **Step 5: Candidate D - account lockout boundary:** `password-service.ts` / auth flow locks after 5 failed attempts and refuses login while `lockedUntil` is in the future.
- [ ] **Step 6: Candidate E - illegal FIR status transition:** if `routes/firs.ts` guards transitions, assert an illegal transition (e.g., `CLOSED → SUBMITTED`) is rejected.
- [ ] **Step 7: Write only the candidates that map to real, missing behavior** (TDD: write test, run to see it fail if behavior absent, implement only if the gap is genuine and in-scope; if already covered or behavior is intentionally permissive, skip and record why).
- [ ] **Step 8: Run the full backend jest suite** - `cd OnlineFirPortal.backend && npm run test:jest` - all pass.
- [ ] **Step 9: Commit + push** (only if new tests were added)
  ```bash
  git add -A
  git commit -m "test: add boundary and failure-path coverage"
  git push origin main
  ```
  If no test was justified, skip the commit and record that in the report.

---

## Task 8: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`** with three jobs, all `permissions: contents: read`:

  `backend` (working-directory `OnlineFirPortal.backend`): checkout → setup-node 20 → `npm ci` → `npx prisma generate` → `npx tsc --noEmit` → `npm run test:jest`.
  `frontend` (working-directory `OnlineFirPortal.frontend`): checkout → setup-node 20 → `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm test` (vitest run) → `npm run build`.
  `docker`: checkout → `docker compose build` (backend + frontend images).

  Trigger: `push` on `main` and `pull_request`.

- [ ] **Step 2: Validate every job command locally** before pushing - run the exact backend and frontend commands in their directories; run `docker compose build` once (may be slow; if it fails, fix the Dockerfile/next.config `output: "standalone"` issue in the same task and re-run).
- [ ] **Step 3: Fix what breaks** (e.g., missing `output: "standalone"` in `next.config.mjs`, lint errors) - keep fixes minimal and justified.
- [ ] **Step 4: Commit + push**, then confirm the GitHub Actions run starts and passes:
  ```bash
  git add -A
  git commit -m "ci: add automated verification workflows"
  git push origin main
  gh run watch
  ```
  If a job fails on GitHub that passed locally, fix and amend in a follow-up commit (keep the failure honest in the report).

---

## Task 9: Repository metadata (description, topics, social preview)

- [ ] **Step 1: Set description + topics via `gh`** (no commit needed):
  ```bash
  gh repo edit Anurup-R-Krishnan/OnlineFirPortal \
    --description "Accessible online First Information Report (FIR) filing platform with evidence integrity, multi-factor authentication, audit trails, and role-based police workflows." \
    --add-topic civic-tech --add-topic e-governance --add-topic public-safety --add-topic fir \
    --add-topic evidence-management --add-topic audit-trail --add-topic mfa \
    --add-topic nextjs --add-topic express --add-topic typescript --add-topic prisma
  ```
  Verify: `gh repo view Anurup-R-Krishnan/OnlineFirPortal --json description,topics`.
- [ ] **Step 2: Social preview** - GitHub does not expose social preview via CLI/API. Point the user to set it from `docs/screenshots/<landing>.png` in repo Settings → "Social preview" (one manual step). Note it in the report.
- [ ] **Step 3: Confirm homepage is unset** (the repo has no live URL; docker-compose references a fake `fir.gov.in` - do not set a homepage).

---

## Task 10: Clean-clone validation

- [ ] **Step 1: Clone fresh** (must not be blocked by the untracked-artifact change):
  ```bash
  rm -rf /tmp/online-fir-portal-validate
  git clone https://github.com/Anurup-R-Krishnan/OnlineFirPortal /tmp/online-fir-portal-validate
  ```
- [ ] **Step 2: Follow the README quick-start literally** - backend `npm ci`, `npx prisma generate`, copy `.env.example` → `.env`, `npm run test:jest`, `npm run build`; frontend `npm ci`, `npm run lint`, `npm test`, `npm run build`. Record any instruction that fails or is ambiguous.
- [ ] **Step 3: Fix README discrepancies** (command flags, order, env expectations) and commit:
  ```bash
  git add -A
  git commit -m "docs: validate setup instructions from clean clone"
  git push origin main
  ```
- [ ] **Step 4: Secret & hygiene re-scan** on the pushed tree: `git ls-files | grep -E '\.env$|dev\.db|node_modules|coverage/|dist/'` → only `.env.example` files and `src/lib/env.ts`.
- [ ] **Step 5: Verify CI green on GitHub** for the final state; screenshot/tabulate the run.

---

## Task 11: Final report (deliverable, not committed)

- [ ] **Step 1: Write the audit & improvement report** covering: S-tier/A-tier rationale (this repo is S-tier), before/after comparison, final folder structure, README summary, CI/test improvements, security & hygiene findings (including the misconfigured global git identity and the benign tracked `.env`), the exact commit sequence executed (with SHAs), remaining technical debt grouped by security/code/deployment/testing/docs, and the genuine contribution roadmap.
- [ ] **Step 2: Deliver the report** in the session (file under the plan directory, not pushed unless the user asks).

---

## Verification Summary

- Every task's verify step is listed inline above. End-to-end: clean clone builds and tests pass; CI green; README claims all traceable to code; no generated artifacts or secrets tracked; no AI attribution or em-dashes anywhere; screenshots are real captures; all commits authored `Anurup R Krishnan <anuruprkrishnan@gmail.com>`; all commits pushed to `origin/main`.
