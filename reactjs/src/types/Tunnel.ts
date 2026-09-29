// Tunnel catalogue using the agreed xyz scheme (X=1 tunnel domain, Y=0 flat).
// Master map: docs/lookup-ids.md (copied verbatim here).
// Ids are append-only: deprecate, never reuse. Bound 1/2 labels are
// per-tunnel; the dialog shows them as the 方向 options.
export interface Tunnel {
  id: number;
  tc: string;
  bounds: [string, string];
}

export const tunnels: Tunnel[] = [
  { id: 101, tc: '獅子山隧道', bounds: ['沙田方向', '九龍方向'] },
  { id: 102, tc: '海底隧道', bounds: ['紅磡方向', '銅鑼灣方向'] },
  { id: 103, tc: '東區海底隧道', bounds: ['柴灣方向', '鰂魚涌方向'] },
  { id: 104, tc: '西區海底隧道', bounds: ['西九龍方向', '西營盤方向'] },
  { id: 105, tc: '大老山隧道', bounds: ['沙田方向', '鑽石山方向'] },
  { id: 106, tc: '城門隧道', bounds: ['沙田方向', '荃灣方向'] },
  { id: 107, tc: '大欖隧道', bounds: ['元朗方向', '荃灣方向'] },
  { id: 108, tc: '尖山/沙田嶺隧道', bounds: ['沙田方向', '長沙灣方向'] },
  { id: 109, tc: '啟德隧道', bounds: ['九龍灣方向', '土瓜灣方向'] },
  { id: 110, tc: '長青/南灣隧道', bounds: ['青衣方向', '荃灣方向'] },
  { id: 111, tc: '將軍澳-藍田隧道', bounds: ['將軍澳方向', '藍田方向'] },
];

export const TunnelName = (id: number): string =>
  tunnels.find(t => t.id === id)?.tc ?? `隧道 #${id}`;

export const TunnelBoundName = (tunnelId: number, bound: number): string =>
  tunnels.find(t => t.id === tunnelId)?.bounds[bound - 1] ?? `方向 ${bound}`;
