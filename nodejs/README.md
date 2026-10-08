# nodejs — backend (Express)

Reference implementation of the 車理數簿 REST API. Express 5 + SQLite via the
built-in `node:sqlite` module (no native/`pg` dependency). Same routes,
status codes and messages as `python`, `dotnet` and `springboot` — see the
[root README](../README.md) for the shared route table.

## Stack

* Node.js **22.5+** (`node:sqlite` `DatabaseSync`); Docker image uses Node 24 LTS
* `express` 5, `cors`, `dotenv`
* Single SQLite file, schema self-created on start

## Files

| File | Purpose |
|---|---|
| `server.js` | All routes + validation + CORS + `/health` |
| `db.js` | SQLite connection, schema DDL, `query(text, params)` shim (`$1` → `?`, UNIQUE errors → SQLSTATE `23505` so `server.js` maps them to 409) |
| `Dockerfile` | `node:24-alpine`, `npm ci --only=production` |

## Run

```powershell
cd nodejs
copy .env.example .env     # defaults work for local SQLite + LAN
npm install
node server.js             # http://localhost:5000
```

### Environment (`.env`)

| Var | Default | Notes |
|---|---|---|
| `PORT` | `5000` | |
| `HOST` | `0.0.0.0` | Keep for containers |
| `SQLITE_PATH` | `../sqlite.db` | Repo-root file shared across backends; compose sets `/data/sqlite.db` |
| `CORS_ORIGIN` | `*` | `*`/empty = allow all (local/LAN). Cloud: comma-separated explicit URL(s) |

## API

Implements every route group from the root README, plus `GET /health` →
`{"status":"ok"}` for Docker/cloud health checks.

Notes specific to this implementation:

* Vehicles: `400 車輛類別無效 / 車牌無效 / 年份無效`,
  `404 找不到車輛`, `409 車輛已被註冊`, `200 車輛註冊成功`,
  `200 車輛已更新`, `204 車輛已刪除`.
* Fuel/charge/service deletes key on `?odm=` (UNIQUE per vehicle);
  fine/parking/tunnel/insurance/licence deletes key on the record id.
* Fuel list adds computed `pricePerLitre`; charge list adds `pricePerKwh`.
* JSON array columns (`items`, `offences`) are parsed on read / stringified
  on write.

## Docker

```bash
docker build ./nodejs -t car-logbook-backend
docker run -p 5000:5000 -e SQLITE_PATH=/data/sqlite.db -v sqlite-data:/data car-logbook-backend
```

Or via compose from the repo root (this is the default backend in
`docker-compose.yml`) — see [docs/deploy.md](../docs/deploy.md).
