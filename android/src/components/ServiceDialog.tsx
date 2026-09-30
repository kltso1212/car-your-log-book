import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addServiceRecord, updateServiceRecord } from '../db/service';
import type { ServiceRecord } from '../db/service';
import { allowedServiceItems, serviceItemGroups, serviceItemName } from '../serviceItems';
import { useVehicles } from '../context';
import { vehicleTypeOf, DEFAULT_VEHICLE_TYPE } from '../data';
import { decodeCustomList, encodeCustomList } from '../customList';
import { CataloguePicker, CustomInputList } from './ItemPicker';
import { parseISODate, toISODate, todayISO } from '../date';

// Insert/edit dialog. Pre-defined items via dropdown (grouped, filtered by
// vehicle type); unlimited custom entries via key-in.
interface Props {
  visible: boolean;
  vehicleId: string;
  initial?: ServiceRecord;
  records: ServiceRecord[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ServiceDialog({ visible, vehicleId, initial, records, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const { vehicles, currentVehicle } = useVehicles();
  const vehicleType = vehicleTypeOf(vehicles, currentVehicle) ?? DEFAULT_VEHICLE_TYPE;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [odm, setOdm] = useState('');
  const [items, setItems] = useState<number[]>([]);
  const [customs, setCustoms] = useState<string[]>([]);
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setOdm(initial ? String(initial.odm) : '');
    setItems(initial ? [...initial.items] : []);
    setCustoms(decodeCustomList(initial?.customItem));
    setPrice(initial ? String(initial.price) : '');
    setShowDatePicker(false);
  }, [visible, initial]);

  const allowed = allowedServiceItems(vehicleType);
  const options = serviceItemGroups.flatMap(g =>
    g.ids
      .filter(id => allowed.includes(id))
      .map(id => ({ value: id, label: `${g.title}：${serviceItemName(id)}` })),
  );

  const handleSave = async () => {
    const rec = {
      date,
      odm: Number(odm),
      items,
      customItem: encodeCustomList(customs),
      price: Number(price),
    };
    if (!rec.date || !rec.odm) {
      Alert.alert('請輸入日期及行車哩數!');
      return;
    }
    if (records.some(r => r.odm === rec.odm && r.id !== initial?.id)) {
      Alert.alert(`${rec.odm} km 已有保養記錄!`);
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateServiceRecord(vehicleId, initial.id, rec);
      } else {
        await addServiceRecord(vehicleId, rec);
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
          <Text style={styles.title}>{isEdit ? '編輯保養記錄' : '新增保養記錄'}</Text>
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
            <TextInput
              style={[styles.input, styles.field]}
              value={price}
              onChangeText={setPrice}
              placeholder="費用 $"
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
          <CataloguePicker
            label="保養項目"
            options={options}
            selected={items}
            onToggle={id =>
              setItems(prev => (prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]))
            }
          />
          <CustomInputList
            label="其他項目"
            placeholder="請註明，按加入"
            values={customs}
            onAdd={text => setCustoms(prev => [...prev, text])}
            onRemove={i => setCustoms(prev => prev.filter((_, k) => k !== i))}
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
  dialog: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16, gap: 8, maxHeight: '92%' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, height: 56, textAlignVertical: 'center' },
  placeholder: { color: '#6c757d' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
