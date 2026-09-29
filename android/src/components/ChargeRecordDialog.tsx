import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addChargeRecord, updateChargeRecord } from '../db/charge';
import type { ChargeRecord } from '../data';
import { parseISODate, toISODate, todayISO } from '../date';

// Same 3-row pattern as FuelRecordDialog, minus vendor/fuel rows:
// date + odm / kwh + price + auto per-kwh / actions.
interface Props {
  visible: boolean;
  vehicleId: string;
  initial?: ChargeRecord;
  records: ChargeRecord[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ChargeRecordDialog({ visible, vehicleId, initial, records, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [odm, setOdm] = useState('');
  const [kwh, setKwh] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setOdm(initial ? String(initial.odm) : '');
    setKwh(initial ? String(initial.kwh) : '');
    setPrice(initial ? String(initial.price) : '');
    setShowDatePicker(false);
  }, [visible, initial]);

  const kwhNum = Number(kwh);
  const priceNum = Number(price);
  const unitPrice = kwhNum > 0 ? priceNum / kwhNum : 0;

  const handleSave = async () => {
    const rec: ChargeRecord = {
      date,
      odm: Number(odm),
      kwh: Number(kwh),
      price: Number(price),
    };
    if (!rec.date || !rec.odm || !rec.kwh || !rec.price) {
      Alert.alert('請輸入有效記錄!');
      return;
    }
    if (records.some(r => r.odm === rec.odm && r.id !== initial?.id)) {
      Alert.alert(`${rec.odm} km 已有充電記錄!`);
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateChargeRecord(vehicleId, Number(initial.id), rec);
      } else {
        await addChargeRecord(vehicleId, rec);
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
          <Text style={styles.title}>{isEdit ? '編輯充電記錄' : '新增充電記錄'}</Text>
          <View style={styles.row}>
            <Text
              style={[styles.input, styles.field, !date && styles.placeholder]}
              onPress={() => setShowDatePicker(true)}>
              {date || '選擇日期'}
            </Text>
            <TextInput
              style={[styles.input, styles.field]}
              value={odm}
              onChangeText={setOdm}
              placeholder="行車哩數"
              keyboardType="numeric"
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
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.field]}
              value={kwh}
              onChangeText={setKwh}
              placeholder="充電量 kWh"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.field]}
              value={price}
              onChangeText={setPrice}
              placeholder="總價錢 $"
              keyboardType="decimal-pad"
            />
            <Text style={[styles.input, styles.field, styles.unit]}>
              $ {unitPrice.toFixed(2)} / kWh
            </Text>
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
  unit: { textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#f8f9fa' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
