"""Pydantic schemas. Wire format matches nodejs/server.js exactly:
camelCase fuelType / pricePerLitre, date as 'YYYY-MM-DD' string.

Vehicle: id INTEGER PK (surrogate), plate TEXT (non-unique, upper-cased),
type int 1 petrol / 2 hybrid / 3 electric / 4 diesel (changeable via PUT),
brand/model TEXT, year int|null (mutable via PUT).
"""
import datetime

from pydantic import BaseModel, ConfigDict


def normalize_plate(v: object) -> str:
    return str(v or "").strip().upper()


def is_valid_year(v: object) -> bool:
    if v is None or v == "":
        return True
    if isinstance(v, bool):
        return False
    try:
        n = int(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return False
    return 1900 <= n <= datetime.date.today().year + 1


class VehicleIn(BaseModel):
    plate: str
    type: int = 1
    brand: str = ""
    model: str = ""
    year: int | None = None


class VehicleUpdate(BaseModel):
    plate: str
    type: int = 1
    brand: str = ""
    model: str = ""
    year: int | None = None


class VehicleOut(BaseModel):
    id: int
    plate: str
    type: int = 1
    brand: str = ""
    model: str = ""
    year: int | None = None


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


class VehicleCreated(Message):
    id: int


class TunnelRecordIn(BaseModel):
    date: datetime.date
    tunnel: int
    bound: int
    fee: float = 0


class TunnelRecordOut(TunnelRecordIn):
    id: int | None = None


class ParkingRecordIn(BaseModel):
    date: datetime.date
    carpark: str
    rentalType: int = 1
    fee: float = 0


class ParkingRecordOut(ParkingRecordIn):
    id: int | None = None


class FineRecordIn(BaseModel):
    date: datetime.date
    offences: list[int] = []
    customOffence: str | None = None
    location: str | None = None
    penalty: float = 0


class FineRecordOut(FineRecordIn):
    id: int | None = None


class ServiceRecordIn(BaseModel):
    date: datetime.date
    odm: int
    items: list[int] = []
    customItem: str | None = None
    price: float = 0


class ServiceRecordOut(ServiceRecordIn):
    id: int | None = None


class InsuranceRecordIn(BaseModel):
    date: datetime.date
    type: int
    broker: str | None = None
    fee: float = 0


class InsuranceRecordOut(InsuranceRecordIn):
    id: int | None = None


class LicenceRecordIn(BaseModel):
    date: datetime.date
    type: int
    fee: float = 0


class LicenceRecordOut(LicenceRecordIn):
    id: int | None = None


class ChargeRecordIn(BaseModel):
    date: datetime.date
    odm: int
    kwh: float = 0
    price: float = 0


class ChargeRecordOut(ChargeRecordIn):
    id: int | None = None
    pricePerKwh: float = 0
