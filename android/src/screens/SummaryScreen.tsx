import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listChargeRecords } from '../db/charge';
import { listFuelRecords } from '../db/fuel';
import { useVehicles } from '../context';
import { ELECTRIC_TYPE, vehicleTypeOf, type ChargeRecord, type FuelRecord } from '../data';
import { compareFuelByDateAsc } from '../sort';

// 總覽: per-vehicle dashboard. Insurance / licence expiry are placeholders
// until those record pages land. 現時行車哩數 spans fuel AND charge records
// (electric vehicles only have the latter); fold service records in here
// once that page has a data layer.
export function maxOdm(records: Array<{ odm: number }>): number {
  return records.reduce((max, r) => Math.max(max, r.odm), 0);
}

// The record behind 現時行車哩數: highest odm, latest date on ties.
// Its date is shown as 最近更新日期. Works across fuel + charge rows.
export function maxOdmRecord<T extends { odm: number; date: string }>(
  records: T[],
): T | undefined {
  let best: T | undefined;
  for (const r of records) {
    if (!best || r.odm > best.odm || (r.odm === best.odm && r.date > best.date)) {
      best = r;
    }
  }
  return best;
}

export function averageConsumption(records: FuelRecord[]): number {
  if (records.length <= 1) return 0;
  const ascending = [...records].sort(compareFuelByDateAsc);
  let consumption = 0;
  for (let i = 1; i < ascending.length; i++) {
    const current = ascending[i]!;
    const previous = ascending[i - 1]!;
    if (current.odm === previous.odm) continue;
    consumption += current.price / (current.odm - previous.odm);
  }
  return consumption / (ascending.length - 1);
}

// Same $/km formula as fuel, over charge records.
export function averagePowerConsumption(records: Array<{ date: string; odm: number; price: number }>): number {
  if (records.length <= 1) return 0;
  const ascending = [...records].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.odm - b.odm,
  );
  let consumption = 0;
  for (let i = 1; i < ascending.length; i++) {
    const current = ascending[i]!;
    const previous = ascending[i - 1]!;
    if (current.odm === previous.odm) continue;
    consumption += current.price / (current.odm - previous.odm);
  }
  return consumption / (ascending.length - 1);
}

export default function SummaryScreen() {
  const { vehicles, currentVehicle } = useVehicles();
  const isElectric = vehicleTypeOf(vehicles, currentVehicle) === ELECTRIC_TYPE;
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [charges, setCharges] = useState<ChargeRecord[]>([]);

  const load = useCallback(async () => {
    if (!currentVehicle) {
      setRecords([]);
      setCharges([]);
      return;
    }
    try {
      const [f, c] = await Promise.all([
        listFuelRecords(currentVehicle),
        listChargeRecords(currentVehicle),
      ]);
      setRecords(f);
      setCharges(c);
    } catch (e: unknown) {
      Alert.alert('載入失敗', e instanceof Error ? e.message : String(e));
      setRecords([]);
      setCharges([]);
    }
  }, [currentVehicle]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!currentVehicle) return <Text style={styles.hint}>請在上方選擇您的座駕</Text>;

  const latest = maxOdmRecord([...records, ...charges]);
  const consumption = averageConsumption(records);
  const power = averagePowerConsumption(charges);
  const shown = isElectric ? power : consumption;

  const rows: Array<{ label: string; value: string; sub?: string; placeholder?: boolean }> = [
    {
      label: '現時行車哩數',
      value: latest ? `${latest.odm} km` : '沒有記錄',
      sub: latest ? `最近更新：${latest.date}` : undefined,
    },
    {
      label: isElectric ? '平均電耗' : '平均油耗',
      value: shown !== 0 ? `$ ${shown.toFixed(2)} / km` : '沒有記錄',
    },
    { label: '保險到期日', value: '尚未設定', placeholder: true },
    { label: '牌費到期日', value: '尚未設定', placeholder: true },
  ];

  return (
    <View style={styles.root}>
      {rows.map(r => (
        <View key={r.label} style={styles.row}>
          <Text style={styles.label}>{r.label}</Text>
          <View style={styles.valueWrap}>
            <Text style={[styles.value, r.placeholder === true && styles.placeholder]}>{r.value}</Text>
            {!!r.sub && <Text style={styles.sub}>{r.sub}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, gap: 8 },
  hint: { padding: 16, color: '#6c757d', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 1,
  },
  label: { fontWeight: '600' },
  valueWrap: { flex: 1 },
  value: { textAlign: 'right' },
  sub: { textAlign: 'right', fontSize: 13, color: '#6c757d' },
  placeholder: { color: '#6c757d' },
});
