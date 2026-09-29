import React, { useState } from 'react';
import { Alert, Button, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { addVehicle, deleteVehicle } from '../db/vehicles';
import { normalizeVehicleType, vehicleTypes, type VehicleType } from '../data';
import { useVehicles } from '../context';

// Port of reactjs/src/components/VehicleSelect.tsx. Rendered above the tab
// navigator so vehicle selection is visible on every page. Single row:
// combo + insert + delete; the plate textbox only pops up when inserting
// (Alert.prompt is iOS-only, so a Modal is used for Android).
export default function VehicleBar() {
  const { vehicles, setVehicles, currentVehicle, setCurrentVehicle } = useVehicles();
  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState<VehicleType>(1);
  const [showInsert, setShowInsert] = useState(false);

  const handleConfirmInsert = async () => {
    const id = draft.trim().toUpperCase();
    if (!id) {
      Alert.alert('請輸入車牌');
      return;
    }
    try {
      await addVehicle(id, draftType);
      setVehicles(prev =>
        [...prev, { id, type: draftType }].sort((a, b) => a.id.localeCompare(b.id)),
      );
      setCurrentVehicle(id);
      setDraft('');
      setDraftType(1);
      setShowInsert(false);
    } catch (e: unknown) {
      Alert.alert('新增失敗', messageOf(e));
    }
  };

  const handleDelete = () => {
    if (!currentVehicle) {
      Alert.alert('請選擇座駕');
      return;
    }
    Alert.alert(`確認刪除${currentVehicle}?`, '', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(currentVehicle);
            setVehicles(prev => prev.filter(v => v.id !== currentVehicle));
            setCurrentVehicle('');
          } catch (e: unknown) {
            Alert.alert('刪除失敗', messageOf(e));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={[styles.pickerWrap, styles.grow]}>
          <Picker
            selectedValue={currentVehicle}
            onValueChange={setCurrentVehicle}
            mode="dropdown"
            style={styles.pickerText}>
          <Picker.Item label="-- 選擇您的座駕 --" value="" />
          {vehicles.map(v => (
            <Picker.Item key={v.id} label={`${v.id} · ${vehicleTypes.find(t => t.id === v.type)?.tc ?? ''}`} value={v.id} />
          ))}
          </Picker>
        </View>
        <RowButton emoji="➕" label="新增座駕" onPress={() => setShowInsert(true)} />
        <RowButton emoji="➖" label="刪除座駕" onPress={handleDelete} />
      </View>
      <Modal
        visible={showInsert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInsert(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>新增座駕</Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="車牌"
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={draftType}
                onValueChange={v => setDraftType(normalizeVehicleType(v))}
                mode="dropdown"
                style={styles.pickerText}>
                {vehicleTypes.map(t => (
                  <Picker.Item key={t.id} label={t.tc} value={t.id} />
                ))}
              </Picker>
            </View>
            <View style={styles.dialogRow}>
              <Button title="取消" onPress={() => setShowInsert(false)} />
              <Button title="新增" onPress={handleConfirmInsert} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Stock RN Button takes no height, so a fixed-height pressable keeps the
// combo + buttons in one row pixel-aligned. Icon-only, like the web app:
// ➕ add vehicle, ➖ delete vehicle.
function RowButton({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.btn} accessibilityLabel={label} accessibilityRole="button">
      <Text style={styles.btnText}>{emoji}</Text>
    </Pressable>
  );
}

// One height for every control in a row: spinner, textbox and button.
// 56 gives the native spinner's internal padding + 16sp text room so
// combo text is never clipped.
const ROW_HEIGHT = 56;

const styles = StyleSheet.create({
  bar: { padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#dee2e6' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  pickerText: { fontSize: 16, height: ROW_HEIGHT },
  btn: {
    height: ROW_HEIGHT,
    minWidth: 64,
    paddingHorizontal: 12,
    backgroundColor: '#2196F3',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: { backgroundColor: '#fff', borderRadius: 8, padding: 16, gap: 12 },
  dialogTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  dialogRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
