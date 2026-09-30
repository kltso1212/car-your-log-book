import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addLicenceRecord, updateLicenceRecord } from '../db/dated';
import type { LicenceRecord } from '../db/dated';
import { parseISODate, toISODate, todayISO } from '../date';

// type: 1 四個月 / 2 十二個月. Expiry (+term −1day) is computed on
// the 總覽 page, never stored.
const LICENCE_TYPES = [
  { id: 1, tc: '四個月' },
  { id: 2, tc: '十二個月' },
];

interface Props {
  visible: boolean;
  vehicleId: string;
  initial?: LicenceRecord;
  records: LicenceRecord[];
  onClose: () => void;
  onSaved: () => void;
}

export default function LicenceDialog({ visible, vehicleId, initial, records, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState(2);
  const [fee, setFee] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setType(initial?.type ?? 2);
    setFee(initial ? String(initial.fee) : '');
    setShowDatePicker(false);
  }, [visible, initial]);

  const handleSave = async () => {
    const rec = { date, type, fee: Number(fee) };
    if (!rec.date) {
      Alert.alert('請選擇日期!');
      return;
    }
    if (records.some(r => r.date === rec.date && r.id !== initial?.id)) {
      Alert.alert(`${rec.date} 已有牌費記錄!`);
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateLicenceRecord(vehicleId, initial.id, rec);
      } else {
        await addLicenceRecord(vehicleId, rec);
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
          <Text style={styles.title}>{isEdit ? '編輯牌費記錄' : '新增牌費記錄'}</Text>
          <View style={styles.row}>
            <Text
              style={[styles.input, styles.field, !date && styles.placeholder]}
              onPress={() => setShowDatePicker(true)}>
              {date || '選擇日期'}
            </Text>
            <View style={[styles.field, styles.pickerWrap]}>
              <Picker selectedValue={type} onValueChange={setType} mode="dropdown" style={styles.pickerText}>
                {LICENCE_TYPES.map(t => (
                  <Picker.Item key={t.id} label={t.tc} value={t.id} />
                ))}
              </Picker>
            </View>
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
          <TextInput
            style={styles.input}
            value={fee}
            onChangeText={setFee}
            placeholder="牌費 $"
            keyboardType="decimal-pad"
          />
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
