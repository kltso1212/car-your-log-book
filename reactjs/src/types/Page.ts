export const pages = ['總覽', '入油', '充電', '保養', '保險', '牌費', '隧道', '泊車', '罰款'] as const;

// Same tab graphics as the android app (android/src/data.ts tab order).
export const pageEmojis = ['🚗', '⛽', '🔋', '🔧', '🛡️', '📜', '🚇', '🅿️', '💸'] as const;

export type PageSlug = 'summary' | 'fuel' | 'charge' | 'service' | 'insurance' | 'licence' | 'tunnel' | 'parking' | 'fine';

export const pageSlugs: PageSlug[] = ['summary', 'fuel', 'charge', 'service', 'insurance', 'licence', 'tunnel', 'parking', 'fine'];

export const FUEL_SLUG: PageSlug = 'fuel';
export const CHARGE_SLUG: PageSlug = 'charge';
export const ELECTRIC_TYPE = 3;
export const DIESEL_TYPE = 4;

/** Electric vehicles charge instead of refuelling (and vice versa). */
export const isSlugForVehicle = (slug: string | undefined, vehicleType: number | undefined): boolean => {
  if (slug === CHARGE_SLUG) return vehicleType === ELECTRIC_TYPE;
  if (slug === FUEL_SLUG) return vehicleType !== ELECTRIC_TYPE;
  return true;
};

/** Default landing tab for a vehicle type. */
export const defaultSlugForVehicle = (vehicleType: number | undefined): PageSlug =>
  vehicleType === ELECTRIC_TYPE ? CHARGE_SLUG : FUEL_SLUG;

export const Page = (id: number): string | undefined => pages.at(id);

export const pageIndexFromSlug = (slug: string | undefined): number => {
  const i = pageSlugs.indexOf(slug as PageSlug);
  return i >= 0 ? i : 0;
};

export const slugFromPageIndex = (index: number): PageSlug => pageSlugs.at(index) ?? 'fuel';

export const vehiclePath = (vehicleId: string, slug: PageSlug = 'fuel'): string =>
  vehicleId ? `/vehicles/${encodeURIComponent(vehicleId)}/${slug}` : '/';
