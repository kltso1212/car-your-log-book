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
export const vehicleTypeOf = (vehicles: Vehicle[], id: string): VehicleType | undefined =>
  vehicles.find(v => v.id === id)?.type;

export const VehicleTypeName = (t: VehicleType | undefined): string =>
  vehicleTypes.find(v => v.id === t)?.tc ?? '';
