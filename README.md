# 車理數簿 | Car Your Log Book

A personal vehicle logbook: register your cars, then track fuel/charging,
servicing, insurance, licence (牌費), tunnels, parking and fines — with a
cost summary per vehicle.

* **Frontend:** `reactjs/` — React SPA (CRA + TypeScript).
* **Backends:** four *alternative* implementations of the **same REST API** —
  `nodejs/` (Express), `python/` (FastAPI), `dotnet/` (ASP.NET Core),
  `springboot/` (Spring Boot). **Run any one at a time**; they share one
  SQLite file, so you can swap implementations without losing data.
* **Docs:** `docs/` — deployment, lookup-id catalogue, powertrain service rules.

## Quick start

### Docker Compose (recommended)

```bash
docker compose up --build
# frontend → http://localhost:3000
# backend  → http://localhost:5000 (nodejs by default; see docker-compose.yml)
```

### Local development

```bash
# Terminal 1 — backend (pick ONE)
cd nodejs     && npm install && node server.js                 # Express, port 5000
cd python     && pip install -r requirements.txt && uvicorn main:app --port 5000
cd dotnet     && dotnet run                                     # port 5000
cd springboot && .\mvnw.cmd spring-boot:run                     # port 5000

# Terminal 2 — frontend
cd reactjs && npm install && npm start                          # port 3000
```

SQLite schema self-creates on first start at the repo root (`sqlite.db`) —
no migration step needed.

## Repository layout

| Path | What it is |
|---|---|
| `reactjs/` | React + TypeScript frontend (CRA), nginx Docker image |
| `nodejs/` | Express 5 backend (`node:sqlite`, Node 22.5+) |
| `python/` | FastAPI backend (uvicorn) |
| `dotnet/` | ASP.NET Core backend (EF Core + SQLite) |
| `springboot/` | Spring Boot backend (JPA + SQLite) |
| `docs/` | Deployment matrix, lookup-id master map, service-item rules |
| `docker-compose.yml` | One backend + frontend, shared `sqlite-data` volume |
| `.env.example` | Root-level knobs (ports, CORS, API URL) |
| `sqlite.db` | Shared database (auto-created; gitignored) |

## Data model

**`vehicles`** — integer `id` PK, non-unique upper-cased `plate`,
`type` (1 petrol / 2 hybrid / 3 electric / 4 diesel), `brand`, `model`, `year`.

Record tables (all cascade on vehicle delete):

| Table | Uniqueness | Delete key |
|---|---|---|
| `fuel_records` | `(vehicle_id, odm)` | `?odm=` |
| `charge_records` | `(vehicle_id, odm)` | `?odm=` |
| `service_records` | `(vehicle_id, odm)` | `?odm=` |
| `insurance_records` | `(vehicle_id, date)` | record id |
| `licence_records` | `(vehicle_id, date)` | record id |
| `tunnel_records` | — | record id |
| `parking_records` | — | record id |
| `fine_records` | — | record id |

Free-text extras live beside the id arrays: `custom_item` (service),
`custom_offence` (fine).

## API

Base URL defaults to `http://localhost:5000`. All backends serve the same
routes, status codes and (mostly Chinese) messages:

| Route group | List | Create | Update | Delete |
|---|---|---|---|---|
| `/api/vehicles` | `GET /` · `GET /{id}` | `POST /` → 200 | `PUT /{id}` | `DELETE /{id}` → 204 |
| `/api/fuelrecords/{vehicleId}` | `GET` (adds `pricePerLitre`) | `POST` → 201 | `PUT /{vehicleId}/{recordId}` | `DELETE ?odm=` → 204 |
| `/api/chargerecords/{vehicleId}` | `GET` (adds `pricePerKwh`) | `POST` → 201 | `PUT /{vehicleId}/{recordId}` | `DELETE ?odm=` → 204 |
| `/api/servicerecords/{vehicleId}` | `GET` | `POST` → 201 (409 dup) | `PUT /{vehicleId}/{recordId}` | `DELETE ?odm=` → 204 |
| `/api/insurancerecords/{vehicleId}` | `GET` | `POST` → 201 (409 dup) | `PUT /{vehicleId}/{recordId}` | `DELETE /{vehicleId}/{recordId}` → 204 |
| `/api/licencerecords/{vehicleId}` | `GET` | `POST` → 201 (409 dup) | `PUT /{vehicleId}/{recordId}` | `DELETE /{vehicleId}/{recordId}` → 204 |
| `/api/tunnelrecords/{vehicleId}` | `GET` | `POST` → 201 | `PUT /{vehicleId}/{recordId}` | `DELETE /{vehicleId}/{recordId}` → 204 |
| `/api/parkingrecords/{vehicleId}` | `GET` | `POST` → 201 | `PUT /{vehicleId}/{recordId}` | `DELETE /{vehicleId}/{recordId}` → 204 |
| `/api/finerecords/{vehicleId}` | `GET` | `POST` → 201 | `PUT /{vehicleId}/{recordId}` | `DELETE /{vehicleId}/{recordId}` → 204 |
| `/health` | `GET` → `{"status":"ok"}` | — | — | — |

Common errors: `400 車牌無效 / 車輛類別無效 / 年份無效`,
`404 找不到車輛 / 找不到…記錄`, `409 車輛已被註冊 / …記錄已存在`.

See each backend's `README.md` for exact per-implementation notes.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Var | Default | Purpose |
|---|---|---|
| `SQLITE_PATH` | `./sqlite.db` (root) | Database file; `/data/sqlite.db` in Docker |
| `BACKEND_PORT` | `5000` | Host port for the backend |
| `CORS_ORIGIN` | `*` | Allowed origin(s); set explicitly in cloud |
| `REACT_APP_API_URL` | `http://localhost:5000` | **Baked at frontend build time**; `/api` = single-origin nginx proxy |
| `FRONTEND_PORT` | `3000` | Host port for the frontend |

The frontend reuses the page hostname at runtime, so a phone on the same
Wi-Fi can open `http://<PC-IP>:3000` with no rebuild.

## Documentation

* [`docs/deploy.md`](docs/deploy.md) — deploy matrix, env vars, health checks,
  SQLite vs Postgres, per-platform notes.
* [`docs/lookup-ids.md`](docs/lookup-ids.md) — xyz lookup-id master map
  (tunnels, service items, offences, vehicle/fuel types).
* [`docs/powertrain-service-items.md`](docs/powertrain-service-items.md) —
  which service items apply per powertrain.
* Sub-projects: [`reactjs/README.md`](reactjs/README.md) ·
  [`nodejs/README.md`](nodejs/README.md) ·
  [`python/README.md`](python/README.md) ·
  [`dotnet/README.md`](dotnet/README.md) ·
  [`springboot/README.md`](springboot/README.md)
