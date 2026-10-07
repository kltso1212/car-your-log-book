import type { Dispatch, SetStateAction } from 'react';
import type { Vehicle } from './Vehicle';

export interface FuelTypeOption {
  en: string;
  tc: string;
}

export interface VendorOption {
  en: string;
  tc: string;
}

export interface FuelRecord {
  id?: number | string; // surrogate PK (bigint; node pg returns string)
  Id?: number | string; // dotnet serializes PascalCase
  date: string;
  odm: number;
  vendor: number;
  fuelType: number;
  litre: number;
  price: number;
  pricePerLitre?: number;
}

export interface VehicleContextValue {
  vehicles: Vehicle[];
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>;
  currentVehicle: number | '';
  setCurrentVehicle: Dispatch<SetStateAction<number | ''>>;
}

export interface PageContextValue {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

export interface FuelRecordContextValue {
  fuelRecords: FuelRecord[];
  setFuelRecords: Dispatch<SetStateAction<FuelRecord[]>>;
}

export interface UserContextValue {
  currentUser: string;
  setCurrentUser: Dispatch<SetStateAction<string>>;
}