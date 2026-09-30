import React, { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// Collapsed single-row summary (selected items joined, like a record line).
// Tap to expand the full checkbox list inline.
export function CataloguePicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Array<{ value: number; label: string }>;
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const summary =
    selected.length > 0
      ? selected.map(id => options.find(o => o.value === id)?.label ?? `項目 #${id}`).join('、')
      : `選擇${label}`;

  return (
    <View style={styles.block}>
      <Pressable
        style={styles.summary}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(o => !o)}>
        <Text style={styles.summaryText} numberOfLines={1}>
          {summary}
        </Text>
        <Text>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <View style={styles.checkList}>
          {options.map(o => {
            const on = selected.includes(o.value);
            return (
              <Pressable key={o.value} style={styles.checkItem} onPress={() => onToggle(o.value)}>
                <Text style={styles.checkBox}>{on ? '☑' : '☐'}</Text>
                <Text style={styles.checkLabel}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Collapsed single-row summary; tap to expand key-in with add button and a
// removable list. Unlimited custom entries.
export function CustomInputList({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  };

  const summary = values.length > 0 ? values.join('、') : placeholder;

  return (
    <View style={styles.block}>
      <Pressable
        style={styles.summary}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(o => !o)}>
        <Text style={styles.summaryText} numberOfLines={1}>
          {summary}
        </Text>
        <Text>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <View style={styles.customEdit}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.field]}
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              onSubmitEditing={handleAdd}
            />
            <Button title="➕" onPress={handleAdd} />
          </View>
          {values.map((v, i) => (
            <View key={`${v}-${i}`} style={styles.customRow}>
              <Text style={styles.customText}>{v}</Text>
              <Button title="✕" onPress={() => onRemove(i)} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  summaryText: { flex: 1, fontSize: 16, color: '#212529' },
  checkList: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
    maxHeight: 220,
  },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkBox: { fontSize: 20, width: 28 },
  checkLabel: { fontSize: 15, flex: 1 },
  customEdit: { gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  field: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, height: 56, textAlignVertical: 'center' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  customText: { fontSize: 15, flex: 1 },
});
