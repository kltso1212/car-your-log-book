# fuel-app Android — Expo (React Native) + local SQLite, fully offline

No login, no backend, no network, no cloud: all data lives in a phone-local
SQLite file (`fuel.db`, via `expo-sqlite`).

## Layout

- `App.tsx` — DB init + vehicle context + bottom tabs (⛽入油/🔧保養/🚇隧道/🅿️泊車/🧾罰款)
- `src/db/database.ts` — open DB, `PRAGMA foreign_keys = ON`, schema v1–v3 + `user_version` upgrades
- `src/db/vehicles.ts`, `src/db/fuel.ts` — local CRUD, same behaviour/messages as the cloud API
- `src/db/errors.ts` — `DbDuplicateError` (車輛已被註冊 / 已有入油記錄)
- `src/components/FuelRecordDialog.tsx` — reusable insert/edit dialog (pattern for future record pages)
- `src/screens/FuelScreen.tsx` — card list with ✏️/🗑️ actions

## Schema (same as the server SQLite databases)

vehicles(id TEXT PK); fuel_records(id AUTOINCREMENT PK, vehicle_id FK CASCADE,
date TEXT ISO, odm, vendor, fuel_type, litre, price, UNIQUE(vehicle_id, odm)).

## Run

```powershell
cd android
npm install
npx expo start   # scan QR with Expo Go or dev build; works with Wi-Fi off
```

## Release APK (side-load, no store)

```powershell
eas build -p android --profile preview   # downloads from expo.dev → Builds
```

Install the `.apk` on the phone (allow install-unknown-apps once). Bump
`android.versionCode` in `app.json` for each new release; reinstalling keeps
the on-phone database — only uninstalling wipes it.
