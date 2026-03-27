# Astro Monorepo (NestJS microservices)

Two NestJS services (`auth-service`, `astro-service`) in an Nx workspace, sharing a Winston logger and connecting to Postgres.

## Prereqs
- Node 20
- Postgres reachable at the configured host/port

## Environment
Copy `.env.example` and apply per-service values:
```sh
cp .env.example apps/auth-service/.env
cp .env.example apps/astro-service/.env
```
Then adjust ports if needed:
- `AUTH_PORT`, `ASTRO_PORT` (or use `PORT` in each service’s .env)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

Defaults in example:
```
LOG_LEVEL=info
DB_HOST=localhost
DB_PORT=5432
DB_NAME=astro-db
DB_USER=ashlee_user
DB_PASSWORD=ashlee123
AUTH_PORT=8001
ASTRO_PORT=8002
```

## Install
```sh
npm install
```

## Run (watch mode, no Nx daemon needed)
```sh
npm run start       # runs auth + astro together with ts-node-dev
```
Individual:
```sh
npm run dev:auth
npm run dev:astro
```

## Shared logger
`libs/logger` provides Winston integration (`createLogger`, `LoggerModule`). Logs are formatted with IST timestamps (`MM/DD/YYYY, h:mm:ss AM/PM`) and write to console and `logs/` files.

## Database
Each service uses `TypeOrmModule.forRootAsync` with Postgres. Connection details are pulled from `.env`. Entities can be added later; migrations are intentionally not included here.

## Health checks
- Auth: `GET /health` -> `{ "status": "ok", "service": "auth-service" }`
- Astro: `GET /health` -> `{ "status": "ok", "service": "astro-service" }`

## Notes
- Logger timestamps are IST formatted.
- Remote transports/migrations are not configured in this repo.
