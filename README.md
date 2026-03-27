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

## ngrok (one agent, two tunnels)

Free ngrok allows only **1 simultaneous agent**. To expose both auth (8001) and astro (8002) at once:

1. Add the `tunnels` block from `ngrok.example.yml` to your ngrok config (e.g. `~/.config/ngrok/ngrok.yml` on Linux). Ensure your `authtoken` is set there.
2. Start the backend: `npm run start`.
3. Run: **`ngrok start --all`** (one process, two URLs).

Share the two URLs with the frontend (or mobile) as `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ASTRO_API_URL`.

## Mobile / other clients (run without backend locally)

A mobile app (or any client) can talk to **deployed** or **staging** APIs so the dev does not need to run the backend locally.

- **Auth API:** base URL e.g. `https://auth.your-domain.com` (or staging). Default local: `http://localhost:8001`
- **Astro API:** base URL e.g. `https://astro.your-domain.com` (or staging). Default local: `http://localhost:8002`

Use **env or app config** (e.g. `API_AUTH_BASE`, `API_ASTRO_BASE`) and point them to the same URLs the web app uses in production/staging. Then the mobile dev can run only the app and have all API calls work against that backend.

## Notes
- Logger timestamps are IST formatted.
- Remote transports/migrations are not configured in this repo.
