# Deployment

This page documents the Docker Compose deployment and the operational scripts
in the repository. It is a demonstration deployment guide, not a certified
production runbook.

## Services

`docker-compose.yml` defines four services:

| Service | Image | Port | Purpose |
| --- | --- | --- | --- |
| `app-backend` | built from `OnlineFirPortal.backend/Dockerfile` | 4001 | Express API. Uses Postgres in this compose file. |
| `app-frontend` | built from `OnlineFirPortal.frontend/Dockerfile` | 4000 | Next.js app served from the standalone build. |
| `db` | `postgres:14-alpine` | 5432 (internal) | Postgres database. |
| `nginx` | `nginx:alpine` | 80, 443 | TLS termination and reverse proxy to the two apps. |

The backend Dockerfile copies `prisma/schema.prisma`, generates the Prisma
client, and runs migrations against `DATABASE_URL`. The frontend Dockerfile
uses the Next.js standalone output, so `next.config.mjs` sets
`output: "standalone"`.

## Environment

Required variables for the compose file come from your environment (or a
`.env` file at the repo root, which is gitignored):

- `DB_PASSWORD` (Postgres password)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` (and
  `FIR_ENCRYPTION_KEY` on the backend image)

The frontend container reads `API_BASE_URL` (the code in `next.config.mjs`
prefers `NEXT_PUBLIC_API_BASE_URL`, then `API_BASE_URL`); it must point at the
backend service, for example `http://app-backend:4001`.

## TLS

nginx terminates TLS on port 443. `nginx.conf` mounts `cert.pem` and
`key.pem` from the repo root. Provide real certificates before exposing the
service, and set `server_name` to the real deployment host. The supplied
config routes `/` to the frontend and `/api` to the backend.

## Backup script (`backup.sh`)

`pg_dump` based, with gzip compression and a 30-day retention policy. It
detects a Postgres container running under Docker and dumps from inside it;
otherwise it uses a local `pg_dump` with `PGPASSWORD`. Set the connection
variables at the top of the script to match the deployment, and configure the
alert email for failure notifications.

```bash
./backup.sh
```

## Monitoring script (`monitor.sh`)

Checks the frontend and backend HTTP endpoints, verifies that the backend
process is responding, checks disk space and memory, and reports health
lines to a log file. The backend health check hits the root route of the
backend service; adjust `BACKEND_URL` to the deployment host and port.

```bash
./monitor.sh
```

Both scripts write to logs under `/var/log` and require the directories to be
writable by the user running them.

## Local (non-Docker) run

For day-to-day development the backend runs on port 4001 against SQLite and
the frontend on port 4000 proxying `/api` to it:

```bash
# backend
cd OnlineFirPortal.backend
cp .env.example .env
npx prisma generate
npm run dev

# frontend
cd OnlineFirPortal.frontend
cp .env.example .env.local   # API_BASE_URL=http://localhost:4001
npm run dev
```

## Known gaps

- The compose deployment is not continuously exercised in CI against the
  SQLite development path; the two configurations can drift.
- Secrets are plain environment variables; there is no secret manager or key
  rotation.
- The frontend build requires `output: "standalone"`; keep that setting when
  editing `next.config.mjs`.
