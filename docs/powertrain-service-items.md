# Powertrain-specific service suggestions (保養)

Vehicle type: 1 petrol（電油車） / 2 hybrid（混能車） / 3 electric（電動車） / 4 diesel（柴油車）.
Set once at vehicle creation, immutable. The xyz catalogue ids below are
stable: deprecate, never reuse (see the lookup-id rules).

## Shared by all (no powertrain filter)

輪胎 / 軚呤 / 輪胎對調 / 四輪定位 / 避震 / 風隔 / 冷氣隔 / 雪種 /
水箱水 / 電池(12V) / 水撥 / 定期政府驗車 / 洗車 / 打蠟 / 鍍膜

## 1 petrol（電油車） — the baseline, everything applies

偈油 / 油隔 / 波箱油 / 火嘴 / 迫力油 / 煞車皮 / 煞車碟 / 軚盤油.

## 2 hybrid（混能車） — petrol baseline, longer intervals + hybrid-only extras

* Still needs (less often): 偈油 / 油隔 / 火嘴 / 迫力油 / 煞車皮 (regen braking
  wears pads far slower — inspect, don't auto-replace).
* Extra vs petrol:
  * 混能電池健康檢查 (new id, e.g. 274) — capacity + cell balance.
  * 逆變器冷卻液 (new id, e.g. 275) — separate loop from engine coolant.

## 3 electric（電動車） — hide all combustion items

* NOT applicable: 偈油 / 油隔 / 波箱油 / 火嘴 / 柴油隔 / 尿素 / DPF清潔 / 軚盤油 / 風隔.
* Still needs: 煞車皮 / 煞車碟 (inspect — regen does most braking) / 迫力油
  (absorbs moisture on time, not mileage) / 12V電池 / 冷氣隔 / 水撥 / 輪胎
  (EVs eat tyres faster — heavier + instant torque; check 對調/定位 often).
* Extra vs petrol (already in catalogue 271–273):
  * 271 電池健康檢查 (traction battery SoH report).
  * 272 充電系統檢查 (charge port, cable, onboard charger).
  * 273 電驅冷卻液 (battery/motor loop).

## 4 diesel（柴油車） — petrol baseline minus spark, plus diesel-only extras

* NOT applicable: 火嘴 (diesels use glow plugs, not spark plugs).
* Still needs: 偈油 (diesel-spec oil) / 油隔 / 波箱油 / 迫力油 / 煞車皮 / 煞車碟 / 軚盤油.
* Extra vs petrol (already in catalogue 215–217):
  * 215 柴油隔 (fuel filter — critical on diesel, water separation).
  * 216 尿素 / AdBlue top-up.
  * 217 DPF清潔 (particulate filter regen inspection/clean).
* Suggested future ids (28x block headroom): 預熱塞 (glow plugs), 渦輪檢查 (turbo).

## Picker rules (already implemented)

* Electric → hide NOT_ON_ELECTRIC list; Diesel → hide 火嘴 + EV-only;
  Hybrid/Petrol → hide diesel-only + EV-only. See `allowedServiceItems`.
* Stored history always resolves (`項目 #id` fallback for unknown ids).
