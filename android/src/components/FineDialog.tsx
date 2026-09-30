import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addFineRecord, updateFineRecord } from '../db/fine';
import type { FineRecord } from '../db/fine';
import { offenceIds, offenceName } from '../offence';
import { decodeCustomList, encodeCustomList } from '../customList';
import { CataloguePicker, CustomInputList } from './ItemPicker';
import { parseISODate, toISODate, todayISO } from '../date';

// Insert/edit dialog. Offences multi-select as toggle chips over the 3xx
// catalogue; free text goes in its own field (custom_offence column).
interface Props {
  visible: boolean;
  vehicleId: string;
  initial?: FineRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function FineDialog({ visible, vehicleId, initial, onClose, onSaved }: Props) {
  const isEdit = initial !== undefined;
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [offences, setOffences] = useState<number[]>([]);
  const [customs, setCustoms] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [penalty, setPenalty] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDate(initial?.date ?? '');
    setOffences(initial ? [...initial.offences] : []);
    setCustoms(decodeCustomList(initial?.customOffence));
    setLocation(initial?.location ?? '');
    setPenalty(initial ? String(initial.penalty) : '');
    setShowDatePicker(false);
  }, [visible, initial]);

  const options = offenceIds.map(id => ({ value: id, label: offenceName(id) }));

  const handleSave = async () => {
    const rec = {
      date,
      offences,
      customOffence: encodeCustomList(customs),
      location: location.trim(),
      penalty: Number(penalty),
    };
    if (!rec.date || (rec.offences.length === 0 && customs.length === 0)) {
      Alert.alert('請選擇日期及違例事項!');
      return;
    }
    try {
      if (isEdit && initial?.id !== undefined) {
        await updateFineRecord(vehicleId, initial.id, rec);
      } else {
        await addFineRecord(vehicleId, rec);
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
          <Text style={styles.title}>{isEdit ? '編輯罰款記錄' : '新增罰款記錄'}</Text>
          <View style={styles.row}>
            <Text
              style={[styles.input, styles.field, !date && styles.placeholder]}
              onPress={() => setShowDatePicker(true)}>
              {date || '選擇日期'}
            </Text>
            <TextInput
              style={[styles.input, styles.field]}
              value={penalty}
              onChangeText={setPenalty}
              placeholder="罰款 $"
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
            label="違例事項"
            options={options}
            selected={offences}
            onToggle={id =>
              setOffences(prev => (prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]))
            }
          />
          <CustomInputList
            label="其他違例事項"
            placeholder="請註明，按加入"
            values={customs}
            onAdd={text => setCustoms(prev => [...prev, text])}
            onRemove={i => setCustoms(prev => prev.filter((_, k) => k !== i))}
          />
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="地點 (選填)"
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
  dialog: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16, gap: 8, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, height: 56, textAlignVertical: 'center' },
  placeholder: { color: '#6c757d' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
