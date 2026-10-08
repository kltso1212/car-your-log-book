// Rental type: 1 時租 / 2 月租.
export const rentalTypes = [
  { en: 'Hourly', tc: '時租' },
  { en: 'Monthly', tc: '月租' },
] as const;

export const RentalTypeName = (t: number): string =>
  rentalTypes[t - 1]?.tc ?? `類別 ${t}`;
