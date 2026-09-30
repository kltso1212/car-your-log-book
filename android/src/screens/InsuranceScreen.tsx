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
import {
  deleteInsuranceRecord,
  listInsuranceRecords,
  type InsuranceRecord,
} from '../db/dated';
import { useVehicles } from '../context';
import InsuranceDialog from '../components/InsuranceDialog';

// Insurance list (type 1 第三者 / 2 綜合). Same card + dialog pattern
// (UNIQUE(vehicle, date), deletes key on the surrogate id).
type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: InsuranceRecord };

const typeName = (t: number): string => (t === 1 ? '第三者保險' : '綜合汽車保險');

export default function InsuranceScreen() {
  const { currentVehicle } = useVehicles();
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

  const load = useCallback(async () => {
    if (!currentVehicle) {
      setRecords([]);
      return;
    }
    setRefreshing(true);
    try {
      setRecords(await listInsuranceRecords(currentVehicle));
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

  const handleDelete = (item: InsuranceRecord) => {
    Alert.alert('確認刪除記錄?', '', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.id === undefined) return;
            await deleteInsuranceRecord(currentVehicle, item.id);
            setRecords(await listInsuranceRecords(currentVehicle));
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
      <Pressable style={styles.addBtn} onPress={() => setDialog({ mode: 'insert' })}>
        <Text style={styles.addBtnText}>➕ 新增保險記錄</Text>
      </Pressable>
      <FlatList
        data={records}
        keyExtractor={item => String(item.id ?? `${item.date}-${item.type}`)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.hint}>沒有記錄</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.title}>
                  {item.date} · {typeName(item.type)}
                </Text>
                <Text>
                  {!!item.broker && `${item.broker} · `}$ {Number(item.fee).toFixed(2)}
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
      <InsuranceDialog
        visible={dialog.mode !== 'closed'}
        vehicleId={currentVehicle}
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
