# Deploy matrix

Pick **one** backend — `nodejs`, `python`, `dotnet`, `springboot` are
alternative implementations of the same API. The frontend (`reactjs`)
works against any of them.

| Mode | Backend DB | Frontend API URL | Command |
|---|---|---|---|
| Local dev | repo-root `sqlite.db` (shared, zero-config) | `http://localhost:5000` (default; LAN IPs auto-detected) | `cd nodejs && npm install && npm start` (or `python`, `dotnet run`, spring-boot) |
| Compose | `/data/sqlite.db` on `sqlite-data` volume | same as local | `docker compose up --build` → http://localhost:3000 |
| Compose single-origin | same volume | `/api` via nginx proxy (no CORS) | build frontend with `REACT_APP_API_URL=/api` |
| Cloud | same image, `SQLITE_PATH=/data/sqlite.db` + persistent disk, **1 replica** | backend URL or `/api` | see per-platform notes |

## Env vars (the only knobs a deployer touches)

| Var | Local default | Container / cloud |
|---|---|---|
| `SQLITE_PATH` | repo-root `sqlite.db` (code default, no `.env` needed) | `/data/sqlite.db` (set by `docker-compose.yml`) |
| `ConnectionStrings__DefaultConnection` (dotnet only) | `Data Source=../sqlite.db` (`appsettings.json`) | `Data Source=/data/sqlite.db` |
| `PORT` / `HOST` | `5000` / `0.0.0.0` | cloud assigns `PORT`; keep `HOST=0.0.0.0` or the container is unreachable |
| `CORS_ORIGIN` | `*` (localhost + LAN phones work with no edits) | `https://<frontend-url>` — required when frontend and backend are on different origins |
| `REACT_APP_API_URL` | `http://localhost:5000` (**baked at frontend build time**) | Option A: `https://<backend-url>` (rebuild frontend) · Option B: `/api` (nginx proxies to backend, no rebuild per env, no CORS) |
| `BACKEND_UPSTREAM` | n/a (frontend only) | nginx proxy target, default `http://backend-node:5000`; runtime env, no rebuild needed |
| `NGINX_RESOLVER` | n/a (frontend only) | DNS for the proxy, default `127.0.0.11` (Docker); override on clouds with other metadata DNS |

## Health checks

All backends serve `GET /health` → `{"status": "ok"}`:

* nodejs: `server.js` · python: `main.py` · dotnet: `Controllers/HealthController.cs` · springboot: `controllers/HealthController.java`

Point the platform's health check at `/health` (backend service) or `/health` on the
frontend (proxied to the backend when built with `/api`).

## SQLite vs Postgres

SQLite (current code) is one file, zero-config, and self-creates its schema on
first start — ideal for local / compose / single-user hosting. Limits in cloud:

* the file lives on the container's filesystem → wiped on redeploy/restart
  unless a persistent disk/volume is attached;
* 2+ replicas = 2+ divergent databases (no sharing).

Rules of thumb for this app:

* personal / family use, 1 replica + persistent disk → stay on SQLite;
* multi-user, autoscaling, or zero-downtime deploys → move to Postgres
  (`Neon`, `Supabase`, `Cloud SQL`, `Railway Postgres`), which means swapping
  the DB driver in each backend you ship (`node:sqlite` → `pg`,
  `sqlite3` → `psycopg`, `sqlite-jdbc`, `Microsoft.Data.Sqlite` → `Npgsql`).

## Per-platform notes (backend = any one `*/Dockerfile`)

* **Render / Railway:** new Web Service from the repo, Dockerfile path
  `nodejs/Dockerfile` (or `python`/`dotnet`/`springboot`), health check path
  `/health`, add a persistent disk mounted at `/data`, set `SQLITE_PATH`,
  `CORS_ORIGIN`, `PORT` is auto-injected. Frontend: static site from `reactjs`
  (`npm run build`, publish `build/`) with `REACT_APP_API_URL` set to the
  backend URL — or deploy the single-origin frontend image instead.
* **Google Cloud Run:** `gcloud run deploy --source ./nodejs --port 5000`,
  requests served on the injected `PORT`; add `--set-env-vars
  SQLITE_PATH=/data/sqlite.db,CORS_ORIGIN=https://<frontend>` and mount a
  Filestore/GCS volume at `/data` (or accept ephemeral storage for a demo).
  Frontend: `Firebase Hosting` + `REACT_APP_API_URL=https://<backend-run-url>`,
  or one Cloud Run service from `reactjs/` built with `REACT_APP_API_URL=/api`
  plus a backend sidecar and `BACKEND_UPSTREAM=http://127.0.0.1:5000`.
* **Frontend-only hosts (`Firebase Hosting`, `Netlify`, `Vercel`):** static
  files only — they cannot run this backend. Host the frontend there and the
  backend on any option above (Option A, needs `CORS_ORIGIN` set).

## Copying data into a volume (compose)

```powershell
docker compose stop backend-node
# drop stale WAL sidecars, then copy the file in:
docker run --rm -v car-your-log-book_sqlite-data:/data alpine rm -f /data/sqlite.db-wal /data/sqlite.db-shm
docker cp sqlite.db car-your-log-book-backend-node-1:/data/sqlite.db
docker compose start backend-node
```
