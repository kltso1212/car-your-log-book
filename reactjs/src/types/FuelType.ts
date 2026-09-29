import type { FuelTypeOption } from './index';

export const fuelTypes: FuelTypeOption[] = [
  { en: 'Standard', tc: '無鉛汽油' },
  { en: 'Premium', tc: '特級無鉛汽油' },
  { en: 'Diesel', tc: '柴油' },
];

/** Index reserved for diesel vehicles (locked, not selectable). */
export const DIESEL_FUEL_TYPE = 2;

export const FuelType = (id: number): FuelTypeOption | undefined => fuelTypes.at(id);
