// type: insurance 1 第三者保險 / 2 綜合汽車保險,
// licence 1 四個月 / 2 十二個月. Mirrors the android dialog constants.
export const insuranceTypes = [
  { id: 1, tc: '第三者保險' },
  { id: 2, tc: '綜合汽車保險' },
] as const;

export const licenceTypes = [
  { id: 1, tc: '四個月' },
  { id: 2, tc: '十二個月' },
] as const;

export const InsuranceTypeName = (t: number): string =>
  insuranceTypes.find(x => x.id === t)?.tc ?? `類別 ${t}`;

export const LicenceTypeName = (t: number): string =>
  licenceTypes.find(x => x.id === t)?.tc ?? `類別 ${t}`;
