import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addTunnelRecord, updateTunnelRecord } from '../db/tunnel';
import type { TunnelRecord } from '../db/tunnel';
import { tunnels } from '../tunnel';
import { parseISODate, toISODate, todayISO } from '../date';

// Insert/edit dialog for tunnel trips. Tunnel picker drives the bound
// (方向) options; fee is free entry (toll varies by vehicle class).
interface Props {
  visible: boolean;
  vehicleId: string;
  initial?: TunnelRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function TunnelDialog({ visible, vehicleId, initial, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tunnel, setTunnel] = useState(tunnels[0]!.id);
  const [bound, setBound] = useState(1);
  const [fee, setFee] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setTunnel(initial?.tunnel ?? tunnels[0]!.id);
    setBound(initial?.bound ?? 1);
    setFee(initial ? String(initial.fee) : '');
    setShowDatePicker(false);
  }, [visible, initial]);

  // Keep bound valid when the tunnel changes (bound count is per-tunnel).
  const boundOptions = tunnels.find(t => t.id === tunnel)?.bounds ?? [];
  useEffect(() => {
    if (!boundOptions[bound - 1]) setBound(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tunnel]);

  const handleSave = async () => {
    const rec = { date, tunnel, bound, fee: Number(fee) };
    if (!rec.date) {
      Alert.alert('請選擇日期!');
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateTunnelRecord(vehicleId, initial.id, rec);
      } else {
        await addTunnelRecord(vehicleId, rec);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      Alert.alert(isEdit ? '儲存失敗' : '新增失敗', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{isEdit ? '編輯隧道記錄' : '新增隧道記錄'}</Text>
          <View style={styles.row}>
            <Text
              style={[styles.input, styles.field, !date && styles.placeholder]}
              onPress={() => setShowDatePicker(true)}>
              {date || '選擇日期'}
            </Text>
            <TextInput
              style={[styles.input, styles.field]}
              value={fee}
              onChangeText={setFee}
              placeholder="隧道費 $"
              keyboardType="decimal-pad"
            />
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date ? parseISODate(date) : parseISODate(todayISO())}
              mode="date"
              display="default"
              onValueChange={(_event, d) => {
                setDate(toISODate(d));
                setShowDatePicker(false);
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}
          <View style={styles.pickerWrap}>
            <Picker selectedValue={tunnel} onValueChange={setTunnel} mode="dropdown" style={styles.pickerText}>
              {tunnels.map(t => (
                <Picker.Item key={t.id} label={t.tc} value={t.id} />
              ))}
            </Picker>
          </View>
          <View style={styles.row}>
            {boundOptions.map((label, i) => (
              <Text
                key={label}
                onPress={() => setBound(i + 1)}
                style={[styles.input, styles.field, styles.bound, i + 1 === bound && styles.boundActive]}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.actions}>
            <Button title="取消" onPress={onClose} />
            <Button title={isEdit ? '儲存' : '新增'} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  dialog: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, height: 56, textAlignVertical: 'center' },
  placeholder: { color: '#6c757d' },
  pickerWrap: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 56, justifyContent: 'center' },
  pickerText: { fontSize: 16, height: 56 },
  bound: { textAlign: 'center' },
  boundActive: { backgroundColor: '#61dafb', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
