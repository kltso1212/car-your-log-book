# python — backend (FastAPI)

Python implementation of the 車理數簿 REST API. FastAPI + stdlib `sqlite3`.
Same routes, status codes and messages as `nodejs`, `dotnet` and
`springboot` — see the [root README](../README.md) for the shared route table.

## Stack

* Python 3.12+, [FastAPI](https://fastapi.tiangolo.com/), uvicorn
* `python-dotenv`, `pydantic` 2 (see `requirements.txt`)
* Single SQLite file via stdlib `sqlite3`, schema self-created on first use

## Structure

| File | Purpose |
|---|---|
| `main.py` | App factory, CORS, router registration, `GET /health` |
| `db.py` | Connection (thread-locked), schema DDL, `rows()` / `execute()` / `insert()` helpers |
| `schemas.py` | Pydantic request/response models |
| `routers/vehicles.py` | `/api/vehicles` |
| `routers/fuelrecords.py` | `/api/fuelrecords` |
| `routers/chargerecords.py` | `/api/chargerecords` |
| `routers/servicerecords.py` | `/api/servicerecords` |
| `routers/finerecords.py` | `/api/finerecords` |
| `routers/parkingrecords.py` | `/api/parkingrecords` |
| `routers/tunnelrecords.py` | `/api/tunnelrecords` |
| `routers/datedrecords.py` | `/api/insurancerecords` + `/api/licencerecords` |
| `Dockerfile` | `python:3.12-slim`, runs uvicorn |

## Run

```powershell
cd python
copy .env.example .env     # defaults work for local SQLite + LAN
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5000
```

Interactive API docs while running: `http://localhost:5000/docs`.

### Environment (`.env`)

Names (`PORT` / `HOST` / `SQLITE_PATH` / `CORS_ORIGIN`) are identical to
`nodejs/.env`:

| Var | Default | Notes |
|---|---|---|
| `PORT` | `5000` | |
| `HOST` | `0.0.0.0` | |
| `SQLITE_PATH` | `../sqlite.db` | Repo-root file shared across backends; compose sets `/data/sqlite.db` |
| `CORS_ORIGIN` | `*` | `*`/empty = allow all (local/LAN). Cloud: comma-separated explicit URL(s) |

## API

Every route group from the root README plus `GET /health` →
`{"status":"ok"}`.

* Vehicles: `GET /api/vehicles` → `200 []` when empty, `POST` → `200
  車輛註冊成功` / `409 車輛已被註冊`, `PUT` → `200 車輛已更新`,
  `DELETE` → `204`.
* Fuel/charge/service deletes key on `?odm=`; fine/parking/tunnel/
  insurance/licence deletes key on the record id.
* Fuel list adds computed `pricePerLitre`; charge list adds `pricePerKwh`.
* DATE columns are stored as `TEXT 'YYYY-MM-DD'` and returned as
  `YYYY-MM-DD` strings, matching the other backends.

## Docker

```bash
docker build ./python -t car-logbook-backend
docker run -p 5000:5000 -e SQLITE_PATH=/data/sqlite.db -v sqlite-data:/data car-logbook-backend
```

Or via compose from the repo root (uncomment `backend-python` in
`docker-compose.yml`) — see [docs/deploy.md](../docs/deploy.md).
