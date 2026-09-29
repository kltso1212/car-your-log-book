"""FastAPI app. Same 6 endpoints + CORS/port conventions as nodejs/server.js:
CORS_ORIGIN=* default (any LAN PC/phone, no IP edits), explicit list in cloud.
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import chargerecords, fuelrecords, vehicles  # noqa: E402

app = FastAPI(title="fuel-app")

cors_origin = (os.getenv("CORS_ORIGIN", "*") or "*").strip()
if cors_origin in ("", "*"):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in cors_origin.split(",") if o.strip()],
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(vehicles.router)
app.include_router(fuelrecords.router)
app.include_router(chargerecords.router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
    )
