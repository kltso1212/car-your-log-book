import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addFineRecord, updateFineRecord, type FineRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FineRecordContext } from '../contexts/FineRecordContext';
import { offenceIds, offenceName } from '../types/Offence';
import { compareFineByDateDesc } from '../utils/fineSort';
import { decodeCustomList, encodeCustomList } from '../utils/customList';
import { ItemSelectionBody, type PickerGroup } from './ItemSelectionBody';

// Shared insert/edit dialog. Offences use the shared picker body: selected
// bubbles on top, checkbox list, 其他 key-in.
export default function FineDialog({
  initial,
  onClose,
}: {
  initial?: FineRecord;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { setFineRecords } = useContext(FineRecordContext);
  const [date, setDate] = useState('');
  const [offences, setOffences] = useState<number[]>([]);
  const [customs, setCustoms] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [penalty, setPenalty] = useState('');

  useEffect(() => {
    setDate(initial?.date ?? '');
    setOffences(initial ? [...initial.offences] : []);
    setCustoms(decodeCustomList(initial?.customOffence));
    setLocation(initial?.location ?? '');
    setPenalty(initial ? String(initial.penalty) : '');
  }, [initial]);

  const groups: PickerGroup[] = [
    { options: offenceIds.map(id => ({ value: id, label: offenceName(id) })) },
  ];

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setter(e.target.value);
    };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const rec = {
      date,
      offences,
      customOffence: encodeCustomList(customs),
      location: location.trim(),
      penalty: Number(penalty),
    };
    if (!rec.date || (rec.offences.length === 0 && customs.length === 0)) {
      return alert('請選擇日期及違例事項!');
    }
    const done = (saved: FineRecord) => {
      setFineRecords(prev => {
        const rest = isEdit ? prev.filter(r => r.id !== initial!.id) : prev;
        return [...rest, saved].sort(compareFineByDateDesc);
      });
      onClose();
    };
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateFineRecord(currentVehicle, { ...rec, id })
        .then(() => done({ ...rec, id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addFineRecord(currentVehicle, rec)
        .then(res => done({ ...rec, id: res.data?.id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯罰款記錄' : '新增罰款記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>罰款 ($)
              <input type="number" min="0" step="any" value={penalty} onChange={handleChange(setPenalty)} />
            </label>
          </div>
          <ItemSelectionBody
            groups={groups}
            selected={offences}
            customs={customs}
            onToggle={id =>
              setOffences(prev => (prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]))
            }
            onRemoveCustom={i => setCustoms(prev => prev.filter((_, k) => k !== i))}
            onAddCustom={text => setCustoms(prev =>
              prev.some(c => c.trim().toLowerCase() === text.trim().toLowerCase())
                ? prev
                : [...prev, text]
            )}
            customPlaceholder="其他 (請註明)"
          />
          <div className="form-row">
            <label>地點 (選填)
              <input value={location} onChange={handleChange(setLocation)} placeholder="地點" />
            </label>
          </div>
          <div className="dialog-actions">
            <button type="button" onClick={onClose}>取消</button>
            <button type="submit">{isEdit ? '儲存' : '新增'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
