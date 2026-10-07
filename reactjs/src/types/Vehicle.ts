export type VehicleType = 1 | 2 | 3 | 4;

export interface Vehicle {
  id: number;
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
}

export interface NewVehicleInput {
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
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

// Popular brands for the add-vehicle dropdown. Anything else goes through
// OTHER_BRAND ("其他"), which reveals a free-text box in the dialog.
export const vehicleBrands: string[] = [
  'Toyota',
  'Honda',
  'Nissan',
  'Mazda',
  'Mitsubishi',
  'Subaru',
  'Suzuki',
  'Hyundai',
  'Kia',
  'Lexus',
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Volkswagen',
  'Volvo',
  'Tesla',
  'BYD',
  'MG',
  'Ford',
  'Land Rover',
  'Mini',
  'Porsche',
];

export const OTHER_BRAND = '__OTHER__';

export const DEFAULT_VEHICLE_TYPE: VehicleType = 1;
export const ELECTRIC_TYPE: VehicleType = 3;
export const DIESEL_TYPE: VehicleType = 4;

export const isVehicleType = (t: unknown): t is VehicleType =>
  t === 1 || t === 2 || t === 3 || t === 4;

const toInt = (t: unknown): number | null => {
  if (typeof t === 'number' && Number.isInteger(t)) return t;
  if (typeof t === 'string' && /^\d+$/.test(t)) return Number(t);
  return null;
};

/** Backend may return ints (or numeric strings); anything else → petrol. */
export const normalizeVehicleType = (t: unknown): VehicleType => {
  const n = toInt(t);
  return n !== null && isVehicleType(n) ? n : DEFAULT_VEHICLE_TYPE;
};

/** Look up the type of the selected vehicle (undefined when none selected). */
export const vehicleTypeOf = (vehicles: Vehicle[], id: number | ''): VehicleType | undefined =>
  vehicles.find(v => v.id === id)?.type;

/** Short spec string for display, e.g. "AB1234 Toyota Corolla 2020". */
export const vehicleLabelOf = (vehicles: Vehicle[], id: number | ''): string => {
  const v = vehicles.find(x => x.id === id);
  if (!v) return id === '' ? '' : String(id);
  return [v.plate, v.brand, v.model, v.year ?? ''].filter(x => x !== '').join(' ');
};

/** Plate only (for titles/filenames), falls back to the raw id. */
export const vehiclePlateOf = (vehicles: Vehicle[], id: number | ''): string => {
  const v = vehicles.find(x => x.id === id);
  if (v) return v.plate;
  return id === '' ? '' : String(id);
};

export const isValidYear = (y: unknown): boolean => {
  if (y === null || y === undefined || y === '') return true;
  if (typeof y !== 'number' || !Number.isInteger(y)) return false;
  return y >= 1900 && y <= new Date().getFullYear() + 1;
};

export const VehicleTypeName = (t: VehicleType | undefined): string =>
  vehicleTypes.find(v => v.id === t)?.tc ?? '';
