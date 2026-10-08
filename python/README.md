# Python backend

Same 6 endpoints, status codes and messages as the Node backend:

- `GET /api/vehicles` → `[{id}]` ordered by id
- `POST /api/vehicles {id}` → 200 車輛註冊成功 / 409 車輛已被註冊
- `DELETE /api/vehicles/{id}` → 204
- `GET /api/fuelrecords/{id}` → list ordered by odm, with `pricePerLitre`
- `POST /api/fuelrecords/{id}` → 201 入油記錄已新增
- `DELETE /api/fuelrecords/{id}?odm=` → 204

## Run

```powershell
cd python
copy .env.example .env   # defaults work for local SQLite + LAN
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5000
```

Env names (`SQLITE_PATH/PORT/HOST/CORS_ORIGIN`)
are identical to `nodejs/.env`. DATE columns return `YYYY-MM-DD` strings,
matching the Node `pg` type-parser behaviour in `nodejs/db.js`.
