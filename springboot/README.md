# fuel-app Spring Boot backend — port of dotnet/

Same routes as `dotnet/Controllers` (`api/vehicles`, `api/fuelrecords`) against
the shared `vehicles` / `fuel_records` tables. Status codes are aligned with
the Node backend + React frontend: vehicle list returns `200 []` when empty,
duplicate vehicle returns `409 車輛已被註冊`.

## Run

```powershell
cd springboot
# copy .env.example values into env, or rely on defaults for local SQLite
$env:PORT=5000
.\mvnw.cmd spring-boot:run
```

Env names (`SQLITE_PATH/PORT/CORS_ORIGIN`)
match `nodejs/.env`. `server.port=${PORT:5000}` so Cloud Run's `PORT` works.

## Notes

- `fuel_records` uses a surrogate `id` PK with `UNIQUE (vehicle_id, odm)`, so
  `odm` is unique per vehicle only. Deletes/lookups still key on
  `(vehicle_id, odm)`, matching the Node backend.
- `DDL_AUTO=validate` (default) checks the mapping against existing tables.
  Use `DDL_AUTO=update` on a fresh database to create them.
