import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addFuelRecord, updateFuelRecord } from '../db/fuel';
import { DIESEL_TYPE, fuelTypes, vendors, type FuelRecord, type VehicleType } from '../data';
import { parseISODate, toISODate, todayISO } from '../date';

// Reusable insert/edit dialog — the pattern other record pages
// (service / tunnel / parking / fine) should copy: one dialog per
// record type, opened in insert mode (initial undefined) or edit mode
// (initial set), parent reloads via onSaved.
interface Props {
  visible: boolean;
  vehicleId: string;
  vehicleType: VehicleType;
  initial?: FuelRecord;
  records: FuelRecord[];
  onClose: () => void;
  onSaved: () => void;
}

// Diesel vehicles lock to fuel type 2 (柴油); all others use 0-1.
export const allowedFuelTypes = (t: VehicleType): number[] =>
  t === DIESEL_TYPE ? [2] : [0, 1];

export default function FuelRecordDialog({ visible, vehicleId, vehicleType, initial, records, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [odm, setOdm] = useState('');
  const [vendor, setVendor] = useState(0);
  const [fuelType, setFuelType] = useState(0);
  const [litre, setLitre] = useState('');
  const [price, setPrice] = useState('');

  // Reset fields every time the dialog opens (insert blank / edit prefill),
  // clamping the fuel type to what this vehicle may use.
  const allowed = allowedFuelTypes(vehicleType);
  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setOdm(initial ? String(initial.odm) : '');
    setVendor(initial?.vendor ?? 0);
    setFuelType(allowed.includes(initial?.fuelType ?? -1) ? initial!.fuelType : allowed[0]!);
    setLitre(initial ? String(initial.litre) : '');
    setPrice(initial ? String(initial.price) : '');
    setShowDatePicker(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial]);

  const litreNum = Number(litre);
  const priceNum = Number(price);
  const unitPrice = litreNum > 0 ? priceNum / litreNum : 0;

  const handleSave = async () => {
    const rec: FuelRecord = {
      date,
      odm: Number(odm),
      vendor,
      fuelType,
      litre: Number(litre),
      price: Number(price),
    };
    if (!rec.date || !rec.odm || !rec.litre || !rec.price) {
      Alert.alert('請輸入有效記錄!');
      return;
    }
    if (records.some(r => r.odm === rec.odm && r.id !== initial?.id)) {
      Alert.alert(`${rec.odm} km 已有入油記錄!`);
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateFuelRecord(vehicleId, Number(initial.id), rec);
      } else {
        await addFuelRecord(vehicleId, rec);
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
          <Text style={styles.title}>{isEdit ? '編輯入油記錄' : '新增入油記錄'}</Text>
          {/* Row 1: date + mileage */}
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
          {/* Row 2: vendor + fuel type */}
          <View style={styles.row}>
            <View style={[styles.field, styles.pickerWrap]}>
              <Picker selectedValue={vendor} onValueChange={setVendor} mode="dropdown" style={styles.pickerText}>
                {vendors.map((v, i) => (
                  <Picker.Item key={v.en} label={v.tc} value={i} />
                ))}
              </Picker>
            </View>
            <View style={[styles.field, styles.pickerWrap]}>
              <Picker
                selectedValue={fuelType}
                onValueChange={setFuelType}
                mode="dropdown"
                style={styles.pickerText}>
                {allowed.map(i => (
                  <Picker.Item key={fuelTypes[i]!.en} label={fuelTypes[i]!.tc} value={i} />
                ))}
              </Picker>
            </View>
          </View>
          {/* Row 3: litre + price + auto per-litre */}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.field]}
              value={litre}
              onChangeText={setLitre}
              placeholder="入油量 L"
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
              $ {unitPrice.toFixed(2)} / L
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
  pickerWrap: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 56, justifyContent: 'center' },
  pickerText: { fontSize: 16, height: 56 },
  unit: { textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#f8f9fa' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
