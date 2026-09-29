import type { VendorOption } from './index';

export const vendors: VendorOption[] = [
  { en: 'SinoPec', tc: '中石化' },
  { en: 'PetroChina', tc: '中國石油' },
  { en: 'Caltex', tc: '加德士' },
  { en: 'Esso', tc: '埃索' },
  { en: 'Shell', tc: '蜆殼' },
];

export const Vendor = (id: number): VendorOption | undefined => vendors.at(id);
