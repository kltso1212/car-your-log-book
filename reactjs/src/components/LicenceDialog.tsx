import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addLicenceRecord, updateLicenceRecord, type LicenceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { LicenceRecordContext } from '../contexts/LicenceRecordContext';
import { licenceTypes } from '../types/DatedTypes';
import { compareLicenceByDateDesc } from '../utils/licenceSort';

// Shared insert/edit dialog (type 1 四個月 / 2 十二個月).
export default function LicenceDialog({
  initial,
  onClose,
}: {
  initial?: LicenceRecord;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { licenceRecords, setLicenceRecords } = useContext(LicenceRecordContext);
  const [date, setDate] = useState('');
  const [type, setType] = useState(2);
  const [fee, setFee] = useState('');

  useEffect(() => {
    setDate(initial?.date ?? '');
    setType(initial?.type ?? 2);
    setFee(initial ? String(initial.fee) : '');
  }, [initial]);

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setter(e.target.value);
    };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const rec = {
      date,
      type: Number(type),
      fee: Number(fee),
    };
    if (!rec.date) {
      return alert('請選擇日期!');
    }
    if (licenceRecords.some(r => r.date === rec.date && r.id !== (isEdit ? initial!.id : -1))) {
      return alert(`${rec.date} 已有牌費記錄!`);
    }
    const done = (saved: LicenceRecord) => {
      setLicenceRecords(prev => {
        const rest = isEdit ? prev.filter(r => r.id !== initial!.id) : prev;
        return [...rest, saved].sort(compareLicenceByDateDesc);
      });
      onClose();
    };
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateLicenceRecord(currentVehicle, { ...rec, id })
        .then(() => done({ ...rec, id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addLicenceRecord(currentVehicle, rec)
        .then(res => done({ ...rec, id: res.data?.id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯牌費記錄' : '新增牌費記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>牌費種類
              <select value={type} onChange={handleChange(v => setType(Number(v)))}>
                {licenceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.tc}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>牌費 ($)
              <input type="number" min="0" step="any" value={fee} onChange={handleChange(setFee)} />
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
