import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteFuelRecord, listFuelRecords } from '../db/fuel';
import { useVehicles } from '../context';
import { DEFAULT_VEHICLE_TYPE, fuelTypes, vendors, vehicleTypeOf, type FuelRecord } from '../data';
import { compareFuelByDateAsc } from '../sort';
import FuelRecordDialog from '../components/FuelRecordDialog';

// Card list + dialog pattern: adding opens the dialog blank, editing opens
// it prefilled. Other record pages (service / tunnel / parking / fine)
// should copy this screen + its dialog when their schemas land.
type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: FuelRecord };

export default function FuelScreen() {
  const { vehicles, currentVehicle } = useVehicles();
  const vehicleType = vehicleTypeOf(vehicles, currentVehicle) ?? DEFAULT_VEHICLE_TYPE;
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

  const load = useCallback(async () => {
    if (!currentVehicle) {
      setRecords([]);
      return;
    }
    setRefreshing(true);
    try {
      setRecords(await listFuelRecords(currentVehicle));
    } catch (e: unknown) {
      Alert.alert('載入失敗', e instanceof Error ? e.message : String(e));
      setRecords([]);
    } finally {
      setRefreshing(false);
    }
  }, [currentVehicle]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Display is newest-first; consumption needs chronological order.
  const ascending = [...records].sort(compareFuelByDateAsc);
  const consumption =
    ascending.length > 1
      ? ascending.slice(1).reduce((sum, cur, i) => {
          const prev = ascending[i]!;
          return cur.odm === prev.odm ? sum : sum + cur.price / (cur.odm - prev.odm);
        }, 0) /
        (ascending.length - 1)
      : 0;

  const handleDelete = (item: FuelRecord) => {
    Alert.alert('確認刪除記錄?', '', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFuelRecord(currentVehicle, item.odm);
            setRecords(await listFuelRecords(currentVehicle));
          } catch (e: unknown) {
            Alert.alert('刪除失敗', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  if (!currentVehicle) return <Text style={styles.hint}>請在上方選擇您的座駕</Text>;

  return (
    <View style={styles.root}>
      {consumption !== 0 && <Text style={styles.avg}>平均油耗：$ {consumption.toFixed(2)} / km</Text>}
      <Pressable style={styles.addBtn} onPress={() => setDialog({ mode: 'insert' })}>
        <Text style={styles.addBtnText}>➕ 新增入油記錄</Text>
      </Pressable>
      <FlatList
        data={records}
        keyExtractor={item => String(item.id ?? item.odm)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.hint}>沒有記錄</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.title}>
                  {item.date} · {item.odm} km
                </Text>
                <Text>
                  {vendors[item.vendor]?.tc} · {fuelTypes[item.fuelType]?.tc}
                </Text>
                <Text>
                  {Number(item.litre).toFixed(2)} L · $ {Number(item.price).toFixed(2)} · ${' '}
                  {Number(item.pricePerLitre ?? 0).toFixed(2)} / L
                </Text>
              </View>
              <View style={styles.cardSide}>
                <Pressable
                  style={styles.iconBtn}
                  hitSlop={8}
                  onPress={() => setDialog({ mode: 'edit', record: item })}>
                  <Text style={styles.iconEmoji}>✏️</Text>
                </Pressable>
                <Pressable
                  style={[styles.iconBtn, styles.dangerBtn]}
                  hitSlop={8}
                  onPress={() => handleDelete(item)}>
                  <Text style={styles.iconEmoji}>🗑️</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <FuelRecordDialog
        visible={dialog.mode !== 'closed'}
        vehicleId={currentVehicle}
        vehicleType={vehicleType}
        initial={dialog.mode === 'edit' ? dialog.record : undefined}
        records={records}
        onClose={() => setDialog({ mode: 'closed' })}
        onSaved={() => void load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, gap: 8 },
  hint: { padding: 16, color: '#6c757d', textAlign: 'center' },
  avg: { fontWeight: '600', textAlign: 'center' },
  addBtn: {
    height: 46,
    backgroundColor: '#2196F3',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { padding: 12, marginBottom: 8, borderRadius: 8, backgroundColor: '#fff', elevation: 1 },
  cardRow: { flexDirection: 'row', gap: 8 },
  cardInfo: { flex: 1, gap: 4 },
  title: { fontWeight: '600' },
  cardSide: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 20 },
  dangerBtn: { backgroundColor: '#f8d7da' },
});
