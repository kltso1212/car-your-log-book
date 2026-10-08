# reactjs — frontend

React + TypeScript single-page app for 車理數簿. Talks to any one of the
four backends (`nodejs`, `python`, `dotnet`, `springboot`) over the shared
REST API — see the [root README](../README.md) for the route table.

## Stack

* [Create React App](https://github.com/facebook/create-react-app) (`react-scripts` 5)
* React 19, TypeScript, `react-router-dom` 7, `axios`
* Docker image: multi-stage build → `nginx:alpine` (serves `build/` + optional `/api` proxy)

## Structure

| Path | Purpose |
|---|---|
| `src/Main.tsx` | Router + app shell: vehicle picker, navbar, routes |
| `src/pages/` | One page per tab (`FuelRecordPage`, `ChargePage`, `ServicePage`, `InsurancePage`, `LicencePage`, `TunnelPage`, `ParkingPage`, `FinePage`, `SummaryPage`, …) |
| `src/components/` | Per-record table/card/dialog triplets, `VehicleSelect`, `NavigationBar`, `VehicleDialog` |
| `src/services/api.ts` | axios instance + all API calls; base-URL resolution |
| `src/contexts/` | React contexts (vehicle, current page, per-record lists) |
| `src/types/` | Shared types + lookup-id constants (mirror `docs/lookup-ids.md`) |
| `src/utils/` | Sorters, fuel stats, date/calendar/expiry helpers |

## Routes

| Path | Meaning |
|---|---|
| `/` | Home / vehicle picker |
| `/:slug` | Tab without a vehicle selected → prompts to pick one |
| `/vehicles/:vehicleId/:slug` | Canonical per-vehicle page; vehicle + tab persist in the URL |
| `/vehicles/:vehicleId` | Redirects to `…/fuel` (or `…/charge` for EVs) |

Tab slugs (`src/types/Page.ts`):
`summary` · `fuel` · `charge` · `service` · `insurance` · `licence` ·
`tunnel` · `parking` · `fine`.

Electric vehicles (type 3) swap `fuel` ↔ `charge`: the default landing tab
and the allowed slug follow the vehicle's powertrain.

## API base URL (`src/services/api.ts`)

`REACT_APP_API_URL` is read at **build time**, then adjusted at runtime:

1. Value starts with `/` (e.g. `/api`) → used as-is (single-origin nginx proxy).
2. Non-localhost URL (cloud backend) → used as-is.
3. `localhost` + page opened via LAN IP/hostname → the **page's hostname** is
   substituted in, so a phone at `http://192.168.x.x:3000` hits
   `http://192.168.x.x:5000` with no rebuild.

Timeout: `REACT_APP_API_TIMEOUT_MS` (default 5000).

## Run

```powershell
cd reactjs
copy .env.example .env     # defaults work for local + LAN
npm install
npm start                  # http://localhost:3000
```

Other scripts:

```powershell
npm test        # Jest, interactive watch mode
npm run build   # production bundle → build/
```

### Environment (`.env`)

| Var | Default | Notes |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000` | Baked at build time; see resolution rules above |
| `REACT_APP_API_TIMEOUT_MS` | `5000` | axios timeout |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | CRA dev server |

## Docker

```bash
docker build ./reactjs -t car-logbook-frontend \
  --build-arg REACT_APP_API_URL=http://localhost:5000
```

* Stage 1 builds the CRA bundle; stage 2 serves it via nginx.
* `nginx.conf.template` is rendered by the nginx entrypoint (`envsubst`) on
  container start, so these are **runtime** env vars:
  * `BACKEND_UPSTREAM` — proxy target, default `http://backend-node:5000`.
  * `NGINX_RESOLVER` — DNS for the proxy, default `127.0.0.11` (Docker).
* The `/api/` proxy and `/health` pass-through are only used when the app was
  built with `REACT_APP_API_URL=/api` (single-origin mode); the default
  direct mode bypasses them.
* SPA fallback (`try_files … /index.html`) keeps deep links working on
  refresh; `index.html` is served `no-store`.

`docker compose up --build` at the repo root wires this up with the backend —
see [docs/deploy.md](../docs/deploy.md).
