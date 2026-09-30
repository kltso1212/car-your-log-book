// Static data mirrored from reactjs/src/types/{Page,Vendor,FuelType}.ts
// so labels stay identical across web + mobile.

export const pages = ['總覽', '入油', '充電', '保養', '保險', '牌費', '隧道', '泊車', '罰款'] as const;
export type PageSlug = 'summary' | 'fuel' | 'charge' | 'service' | 'insurance' | 'licence' | 'tunnel' | 'parking' | 'fine';
export const pageSlugs: PageSlug[] = ['summary', 'fuel', 'charge', 'service', 'insurance', 'licence', 'tunnel', 'parking', 'fine'];

export interface Option {
  en: string;
  tc: string;
}

export const vendors: Option[] = [
  { en: 'SinoPec', tc: '中石化' },
  { en: 'PetroChina', tc: '中國石油' },
  { en: 'Caltex', tc: '加德士' },
  { en: 'Esso', tc: '埃索' },
  { en: 'Shell', tc: '蜆殼' },
];

export const fuelTypes: Option[] = [
  { en: 'Standard', tc: '無鉛汽油' },
  { en: 'Premium', tc: '特級無鉛汽油' },
  { en: 'Diesel', tc: '柴油' },
];

// Rental type: 1 時租 / 2 月租.
export const rentalTypes: Option[] = [
  { en: 'Hourly', tc: '時租' },
  { en: 'Monthly', tc: '月租' },
];

/** Index reserved for diesel vehicles (locked, not selectable). */
export const DIESEL_FUEL_TYPE = 2;

export type VehicleType = 1 | 2 | 3 | 4;

export interface Vehicle {
  id: string;
  type: VehicleType;
}

export interface VehicleTypeOption {
  id: VehicleType;
  en: string;
  tc: string;
}

// 1 petrol / 2 hybrid / 3 electric / 4 diesel. Set at creation, immutable.
export const vehicleTypes: VehicleTypeOption[] = [
  { id: 1, en: 'petrol', tc: '電油車' },
  { id: 2, en: 'hybrid', tc: '混能車' },
  { id: 3, en: 'electric', tc: '電動車' },
  { id: 4, en: 'diesel', tc: '柴油車' },
];

export const DEFAULT_VEHICLE_TYPE: VehicleType = 1;
export const ELECTRIC_TYPE: VehicleType = 3;
export const DIESEL_TYPE: VehicleType = 4;

export const isVehicleType = (t: unknown): t is VehicleType =>
  t === 1 || t === 2 || t === 3 || t === 4;

export const normalizeVehicleType = (t: unknown): VehicleType =>
  isVehicleType(t) ? t : DEFAULT_VEHICLE_TYPE;

/** Look up the type of the selected vehicle (undefined when none selected). */
export const vehicleTypeOf = (vehicles: Vehicle[], id: string): VehicleType | undefined =>
  vehicles.find(v => v.id === id)?.type;

export const VehicleTypeName = (t: VehicleType | undefined): string =>
  vehicleTypes.find(v => v.id === t)?.tc ?? '';

export interface FuelRecord {
  id?: number | string; // surrogate PK from GET; deletes still key on (vehicle, odm)
  date: string;
  odm: number;
  vendor: number;
  fuelType: number;
  litre: number;
  price: number;
  pricePerLitre?: number;
}

export interface ChargeRecord {
  id?: number | string; // surrogate PK from GET; deletes still key on (vehicle, odm)
  date: string;
  odm: number;
  kwh: number;
  price: number;
  pricePerKwh?: number;
}
