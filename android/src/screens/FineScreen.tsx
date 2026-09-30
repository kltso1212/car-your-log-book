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
import { deleteFineRecord, listFineRecords, type FineRecord } from '../db/fine';
import { useVehicles } from '../context';
import { offenceName } from '../offence';
import { displayCustomList } from '../customList';
import FineDialog from '../components/FineDialog';

// Fine list. Same card + dialog pattern as the other pages
// (no UNIQUE constraint, deletes key on the surrogate id).
type DialogState = { mode: 'closed' } | { mode: 'insert' } | { mode: 'edit'; record: FineRecord };

function describe(item: FineRecord): string {
  const parts = item.offences.map(offenceName);
  const custom = displayCustomList(item.customOffence);
  if (custom) parts.push(custom);
  return parts.join('、');
}

export default function FineScreen() {
  const { currentVehicle } = useVehicles();
  const [records, setRecords] = useState<FineRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

  const load = useCallback(async () => {
    if (!currentVehicle) {
      setRecords([]);
      return;
    }
    setRefreshing(true);
    try {
      setRecords(await listFineRecords(currentVehicle));
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

  const handleDelete = (item: FineRecord) => {
    Alert.alert('確認刪除記錄?', '', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.id === undefined) return;
            await deleteFineRecord(currentVehicle, item.id);
            setRecords(await listFineRecords(currentVehicle));
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
        <Text style={styles.addBtnText}>➕ 新增罰款記錄</Text>
      </Pressable>
      <FlatList
        data={records}
        keyExtractor={item => String(item.id ?? `${item.date}-${item.penalty}`)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.hint}>沒有記錄</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.title}>
                  {item.date} · $ {Number(item.penalty).toFixed(2)}
                </Text>
                <Text>{describe(item)}</Text>
                {!!item.location && <Text>{item.location}</Text>}
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
      <FineDialog
        visible={dialog.mode !== 'closed'}
        vehicleId={currentVehicle}
        initial={dialog.mode === 'edit' ? dialog.record : undefined}
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
