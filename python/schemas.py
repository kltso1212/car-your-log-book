"""Pydantic schemas. Wire format matches nodejs/server.js exactly:
camelCase fuelType / pricePerLitre, date as 'YYYY-MM-DD' string.

Vehicle type is int: 1 petrol / 2 hybrid / 3 electric / 4 diesel.
Set once at creation; no update endpoint exists so it is immutable.
"""
import datetime

from pydantic import BaseModel, ConfigDict


class VehicleIn(BaseModel):
    id: str
    type: int = 1


class VehicleOut(BaseModel):
    id: str
    type: int = 1


class FuelRecordIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: datetime.date
    odm: int
    vendor: int = 0
    fuelType: int = 0
    litre: float = 0
    price: float = 0


class FuelRecordOut(FuelRecordIn):
    id: int | None = None
    pricePerLitre: float = 0


class Message(BaseModel):
    message: str


class ChargeRecordIn(BaseModel):
    date: datetime.date
    odm: int
    kwh: float = 0
    price: float = 0


class ChargeRecordOut(ChargeRecordIn):
    id: int | None = None
    pricePerKwh: float = 0
