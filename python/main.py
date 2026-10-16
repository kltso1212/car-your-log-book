"""FastAPI app. Same 6 endpoints + CORS/port conventions as nodejs/server.js:
CORS_ORIGIN=* default (any LAN PC/phone, no IP edits), explicit list in cloud.
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import chargerecords, datedrecords, finerecords, fuelrecords, images, parkingrecords, servicerecords, tunnelrecords, vehicles  # noqa: E402

app = FastAPI(title="vehicle-management")

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

app.include_router(images.router)
app.include_router(vehicles.router)
app.include_router(fuelrecords.router)
app.include_router(chargerecords.router)
app.include_router(tunnelrecords.router)
app.include_router(parkingrecords.router)
app.include_router(finerecords.router)
app.include_router(servicerecords.router)
app.include_router(datedrecords.insurance_router)
app.include_router(datedrecords.licence_router)


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
