# dotnet — backend (ASP.NET Core)

.NET implementation of the 車理數簿 REST API. ASP.NET Core controllers +
EF Core (SQLite). Same routes, status codes and messages as `nodejs`,
`python` and `springboot` — see the [root README](../README.md) for the
shared route table.

## Stack

* .NET **10** (`net10.0`), ASP.NET Core MVC controllers
* Entity Framework Core + `Microsoft.EntityFrameworkCore.Sqlite`
* Swashbuckle (Swagger UI, Development environment only)
* Single SQLite file, schema created on start

## Structure

| Path | Purpose |
|---|---|
| `Program.cs` | DI, CORS, pipeline, startup DDL (`EnsureCreated` + `CREATE TABLE IF NOT EXISTS` for newer tables) |
| `Controllers/` | `Vehicles`, `FuelRecords`, `ChargeRecords`, `ServiceRecords`, `FineRecords`, `ParkingRecords`, `TunnelRecords`, `DatedRecords` (insurance + licence), `Health` |
| `Services/` | Per-record service layer (interface + implementation) |
| `Models/` | Entities + `AppDbContext` |
| `appsettings.json` | Connection string + logging defaults |
| `dotnet.http` | Sample requests for manual testing |
| `Dockerfile` | Multi-stage: SDK 10 build → `aspnet:10.0` run |

## Run

```powershell
cd dotnet
# optional: override appsettings.json from the shell (no .env file needed)
$env:ConnectionStrings__DefaultConnection="Data Source=../sqlite.db"
$env:CORS_ORIGIN="*"
dotnet run
# → http://localhost:5000  (see Properties/launchSettings.json)
```

Swagger UI (Development): `http://localhost:5000/swagger`.

### Configuration

| Setting | Default | Notes |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | `Data Source=../sqlite.db` | Repo-root file shared across backends; compose sets `Data Source=/data/sqlite.db` |
| `CORS_ORIGIN` | `*` | `*`/empty = allow all (local/LAN). Cloud: comma-separated explicit URL(s) |
| `ASPNETCORE_URLS` | `http://+:5000` (Docker) | Kestrel bind address |

`.env.example` shows the env-var names; they override `appsettings.json`
without editing files.

## API

Every route group from the root README (`api/[controller]` attribute routes)
plus `GET /health` → `{"status":"ok"}`.

Schema notes:

* `Program.cs` runs `EnsureCreated()` on start, then issues explicit
  `CREATE TABLE IF NOT EXISTS` statements for tables added after the first
  schema (charge/tunnel/parking/fine/service/insurance/licence) plus their
  unique indexes — so an existing `sqlite.db` is brought forward on boot.
* Deletes/lookups key on `?odm=` for fuel/charge/service and on the record
  id for fine/parking/tunnel/insurance/licence, matching the other backends.

## Docker

```bash
docker build ./dotnet -t car-logbook-backend
docker run -p 5000:5000 -e ConnectionStrings__DefaultConnection="Data Source=/data/sqlite.db" -v sqlite-data:/data car-logbook-backend
```

Or via compose from the repo root (uncomment `backend-dotnet` in
`docker-compose.yml`) — see [docs/deploy.md](../docs/deploy.md).
