// Offence catalogue using the agreed xyz scheme (X=3 offence domain, Y=0).
// Master map: docs/lookup-ids.md (copied verbatim here).
// Ids are append-only: deprecate, never reuse. Free-text extras carry no id
// (custom_offence column next to the int array).
export interface OffenceItem {
  id: number;
  tc: string;
  deprecated?: boolean;
}

export const offenceItems: Record<number, OffenceItem> = {
  301: { id: 301, tc: '違例泊車' },
  302: { id: 302, tc: '超速駕駛' },
  303: { id: 303, tc: '衝紅燈' },
  304: { id: 304, tc: '不小心駕駛' },
};

export const offenceIds: number[] = [301, 302, 303, 304];

export const offenceName = (id: number): string =>
  offenceItems[id]?.tc ?? `項目 #${id}`;

export const offenceNames = (ids: number[]): string =>
  ids.map(offenceName).join('、');
