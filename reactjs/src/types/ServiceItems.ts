import type { VehicleType } from './Vehicle';

// Service-item catalogue using the agreed xyz scheme (X=2 service domain).
// Base groups 21-26 (see docs/lookup-ids.md when created); 215-217 are diesel
// specifics reusing engine-block headroom; 27x is the EV-system block.
// Ids are append-only: deprecate, never reuse.
export interface ServiceItem {
  id: number;
  tc: string;
  deprecated?: boolean;
}

export const serviceItemGroups: { title: string; ids: number[] }[] = [
  { title: '引擎與傳動系統', ids: [211, 212, 213, 214, 215, 216, 217] },
  { title: '煞車與轉向系統', ids: [221, 222, 223, 224] },
  { title: '過濾與空調系統', ids: [231, 232, 233] },
  { title: '冷卻與電力系統', ids: [241, 242, 243] },
  { title: '底盤、輪胎與懸掛', ids: [251, 252, 253, 254, 255] },
  { title: '電動車系統', ids: [271, 272, 273] },
  { title: '其他 / 綜合項目', ids: [261, 262, 263, 264] },
];

export const serviceItems: Record<number, ServiceItem> = {
  211: { id: 211, tc: '偈油' },
  212: { id: 212, tc: '油隔' },
  213: { id: 213, tc: '波箱油' },
  214: { id: 214, tc: '火嘴' },
  215: { id: 215, tc: '柴油隔' },
  216: { id: 216, tc: '尿素' },
  217: { id: 217, tc: 'DPF清潔' },
  221: { id: 221, tc: '迫力油' },
  222: { id: 222, tc: '煞車皮' },
  223: { id: 223, tc: '煞車碟' },
  224: { id: 224, tc: '軚盤油' },
  231: { id: 231, tc: '風隔' },
  232: { id: 232, tc: '冷氣隔' },
  233: { id: 233, tc: '雪種' },
  241: { id: 241, tc: '水箱水' },
  242: { id: 242, tc: '電池' },
  243: { id: 243, tc: '水撥' },
  251: { id: 251, tc: '輪胎' },
  252: { id: 252, tc: '軚呤' },
  253: { id: 253, tc: '輪胎對調' },
  254: { id: 254, tc: '四輪定位' },
  255: { id: 255, tc: '避震' },
  261: { id: 261, tc: '定期政府驗車' },
  262: { id: 262, tc: '洗車' },
  263: { id: 263, tc: '打蠟' },
  264: { id: 264, tc: '鍍膜' },
  271: { id: 271, tc: '電池健康檢查' },
  272: { id: 272, tc: '充電系統檢查' },
  273: { id: 273, tc: '電驅冷卻液' },
};

const DIESEL_ONLY = [215, 216, 217];
const EV_ONLY = [271, 272, 273];
// No spark plugs on diesel; no engine oil/filter/ATF, spark plugs, steering
// fluid or engine air filter on electric.
const NOT_ON_DIESEL = [214];
const NOT_ON_ELECTRIC = [211, 212, 213, 214, 215, 216, 217, 224, 231];

/**
 * Which catalogue ids the service picker offers for a vehicle type.
 * The future service dialog filters by this; stored history always resolves
 * (unknown ids fall back to `項目 #id`, per the lookup-id rules).
 */
export const allowedServiceItems = (type: VehicleType): number[] => {
  const all = Object.keys(serviceItems).map(Number);
  switch (type) {
    case 3: // electric
      return all.filter(id => !NOT_ON_ELECTRIC.includes(id));
    case 4: // diesel
      return all.filter(id => !NOT_ON_DIESEL.includes(id) && !EV_ONLY.includes(id));
    case 2: // hybrid
    case 1: // petrol
    default:
      return all.filter(id => !DIESEL_ONLY.includes(id) && !EV_ONLY.includes(id));
  }
};

export const serviceItemName = (id: number): string =>
  serviceItems[id]?.tc ?? `項目 #${id}`;
