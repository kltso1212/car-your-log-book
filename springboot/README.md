# springboot — backend (Spring Boot)

Java implementation of the 車理數簿 REST API. Spring Boot + JPA (Hibernate)
against SQLite. Same routes, status codes and messages as `nodejs`,
`python` and `dotnet` — see the [root README](../README.md) for the shared
route table.

## Stack

* Spring Boot **4.1**, Java **25** (Maven wrapper `mvnw` included)
* `spring-boot-starter-webmvc`, `data-jpa`, `validation`
* `sqlite-jdbc` + `hibernate-community-dialects` (`SQLiteDialect`)
* Single SQLite file, schema self-created via JPA

## Structure

| Path | Purpose |
|---|---|
| `src/main/java/.../controllers/` | `Vehicles`, `FuelRecords`, `ChargeRecords`, `ServiceRecords`, `FineRecords`, `ParkingRecords`, `TunnelRecords`, `DatedRecords` (insurance + licence), `Health` |
| `.../services/` | Per-record service layer + `UniqueIndexMigrator`, `VehicleTypeBackfill` |
| `.../repositories/` | Spring Data JPA repositories |
| `.../models/` + `.../dto/` | Entities, DTOs, `LocalDateStringConverter` |
| `.../config/CorsConfig.java` | `CORS_ORIGIN` handling |
| `src/main/resources/application.properties` | Port, datasource, JPA, CORS |
| `Dockerfile` | Multi-stage: Maven build → `eclipse-temurin:25-jre` run |

## Run

```powershell
cd springboot
# defaults work for local SQLite; or set env vars (see below)
$env:PORT=5000
.\mvnw.cmd spring-boot:run
# → http://localhost:5000
```

### Environment (`application.properties`)

Names match `nodejs/.env`:

| Var | Default | Notes |
|---|---|---|
| `PORT` | `5000` | `server.port=${PORT:5000}` so Cloud Run's injected `PORT` works |
| `SQLITE_PATH` | `../sqlite.db` | Repo-root file shared across backends; compose sets `/data/sqlite.db` |
| `CORS_ORIGIN` | `*` | `*`/empty = allow all (local/LAN). Cloud: explicit URL(s) |
| `DDL_AUTO` | `update` | `validate` checks the mapping against existing tables; `update` creates them on a fresh database |

## API

Controllers are mapped under `@RequestMapping("/api/...")` for every route
group in the root README, plus `GET /health` → `{"status":"ok"}`.

Status codes are aligned with the Node backend + React frontend:
vehicle list returns `200 []` when empty, duplicate vehicle returns
`409 車輛已被註冊`.

### Notes

- `fuel_records` uses a surrogate `id` PK with `UNIQUE (vehicle_id, odm)`, so
  `odm` is unique per vehicle only. Deletes/lookups still key on
  `(vehicle_id, odm)`, matching the Node backend.
- `UniqueIndexMigrator` / `VehicleTypeBackfill` bring an existing
  `sqlite.db` forward on boot (add missing unique indexes, backfill
  `vehicles.type`).
- Dates serialize as `yyyy-MM-dd` (`spring.jackson.date-format`), matching
  the other backends.

## Docker

```bash
docker build ./springboot -t car-logbook-backend
docker run -p 5000:5000 -e SQLITE_PATH=/data/sqlite.db -v sqlite-data:/data car-logbook-backend
```

Or via compose from the repo root (uncomment `backend-springboot` in
`docker-compose.yml`) — see [docs/deploy.md](../docs/deploy.md).
