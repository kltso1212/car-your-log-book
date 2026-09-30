import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addParkingRecord, updateParkingRecord } from '../db/parking';
import type { ParkingRecord } from '../db/parking';
import { rentalTypes } from '../data';
import { parseISODate, toISODate, todayISO } from '../date';

// Insert/edit dialog. Carpark is free text entry.
interface Props {
  visible: boolean;
  vehicleId: string;
  initial?: ParkingRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function ParkingDialog({ visible, vehicleId, initial, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [carpark, setCarpark] = useState('');
  const [rentalType, setRentalType] = useState(1);
  const [fee, setFee] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setCarpark(initial?.carpark ?? '');
    setRentalType(initial?.rentalType ?? 1);
    setFee(initial ? String(initial.fee) : '');
    setShowDatePicker(false);
  }, [visible, initial]);

  const handleSave = async () => {
    const rec = { date, carpark: carpark.trim(), rentalType, fee: Number(fee) };
    if (!rec.date || !rec.carpark) {
      Alert.alert('請輸入日期及停車場!');
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateParkingRecord(vehicleId, initial.id, rec);
      } else {
        await addParkingRecord(vehicleId, rec);
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
          <Text style={styles.title}>{isEdit ? '編輯泊車記錄' : '新增泊車記錄'}</Text>
          <View style={styles.row}>
            <Text
              style={[styles.input, styles.field, !date && styles.placeholder]}
              onPress={() => setShowDatePicker(true)}>
              {date || '選擇日期'}
            </Text>
            <View style={[styles.field, styles.pickerWrap]}>
              <Picker selectedValue={rentalType} onValueChange={setRentalType} mode="dropdown" style={styles.pickerText}>
                {rentalTypes.map((r, i) => (
                  <Picker.Item key={r.en} label={r.tc} value={i + 1} />
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
            value={carpark}
            onChangeText={setCarpark}
            placeholder="停車場"
          />
          <TextInput
            style={styles.input}
            value={fee}
            onChangeText={setFee}
            placeholder="費用 $"
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
