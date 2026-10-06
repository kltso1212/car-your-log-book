# Lookup-id master map (xyz scheme)

`X` = domain (1 tunnel / 2 service / 3 offence; `0` reserved for shared
lookups — currently unused). `Y` = category (`0` = flat, no sub-categories;
`9` = reserved overflow in every domain). `Z` = sub-id starting at 1
(`Z=0` is never valid — catches off-by-one bugs).

Rules: append-only (deprecate, never reuse ids); unknown ids render as
`項目 #id`, never crash; each codebase copies this file verbatim into its
constants (`reactjs/src/types/*`).

## Vehicle type (separate small-int domain, NOT xyz)

| id | en | tc |
|---|---|---|
| 1 | petrol | 電油車 |
| 2 | hybrid | 混能車 |
| 3 | electric | 電動車 |
| 4 | diesel | 柴油車 |

## Fuel type (index into per-app list)

| id | en | tc | locked to |
|---|---|---|---|
| 0 | Standard | 無鉛汽油 | non-diesel |
| 1 | Premium | 特級無鉛汽油 | non-diesel |
| 2 | Diesel | 柴油 | diesel only |

## 1xx tunnel (Y=0 flat; bound 1/2 labels per tunnel)

| id | tc | bound 1 | bound 2 |
|---|---|---|---|
| 101 | 獅子山隧道 | 沙田方向 | 九龍方向 |
| 102 | 海底隧道 | 紅磡方向 | 銅鑼灣方向 |
| 103 | 東區海底隧道 | 柴灣方向 | 鰂魚涌方向 |
| 104 | 西區海底隧道 | 西九龍方向 | 西營盤方向 |
| 105 | 大老山隧道 | 沙田方向 | 鑽石山方向 |
| 106 | 城門隧道 | 沙田方向 | 荃灣方向 |
| 107 | 大欖隧道 | 元朗方向 | 荃灣方向 |
| 108 | 尖山/沙田嶺隧道 | 沙田方向 | 長沙灣方向 |
| 109 | 啟德隧道 | 九龍灣方向 | 土瓜灣方向 |
| 110 | 長青/南灣隧道 | 青衣方向 | 荃灣方向 |
| 111 | 將軍澳-藍田隧道 | 將軍澳方向 | 藍田方向 |

## 2xx service items

| id | tc | hidden on |
|---|---|---|
| 211 | 偈油 | electric |
| 212 | 偈油隔 | electric |
| 213 | 波箱油 | electric |
| 214 | 火嘴 | electric, diesel |
| 215 | 柴油隔 | petrol, hybrid, electric |
| 216 | 電油隔 | diesel, electric |
| 217 | 尿素 | petrol, hybrid, electric |
| 218 | DPF清潔 | petrol, hybrid, electric |
| 221 | 煞車油 | — |
| 222 | 煞車皮 | — |
| 223 | 煞車碟 | — |
| 224 | 軚盤油 | electric |
| 231 | 風隔 | electric |
| 232 | 冷氣隔 | — |
| 233 | 雪種 | — |
| 241 | 水箱水 | — |
| 242 | 電池 | — |
| 243 | 水撥 | — |
| 251 | 輪胎 | — |
| 252 | 軚呤 | — |
| 253 | 輪胎對調 | — |
| 254 | 四輪定位 | — |
| 255 | 避震 | — |
| 261 | 電池健康檢查 | petrol, hybrid, diesel |
| 262 | 充電系統檢查 | petrol, hybrid, diesel |
| 263 | 電驅冷卻液 | petrol, hybrid, diesel |
| 271 | 定期政府驗車 | — |
| 272 | 洗車 | — |
| 273 | 打蠟 | — |
| 274 | 鍍膜 | — |

Free-text "其他 (請註明)" carries no id — stored in the `custom_item`
column next to the int array.

## 3xx offence items

| id | tc |
|---|---|
| 301 | 違例泊車 |
| 302 | 超速駕駛 |
| 303 | 衝紅燈 |
| 304 | 不小心駕駛 |

Free-text extras go in `custom_offence`, same pattern as service items.
