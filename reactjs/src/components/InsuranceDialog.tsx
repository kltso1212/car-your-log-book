import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addInsuranceRecord, updateInsuranceRecord, type InsuranceRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { InsuranceRecordContext } from '../contexts/InsuranceRecordContext';
import { insuranceTypes } from '../types/DatedTypes';
import { compareInsuranceByDateDesc } from '../utils/insuranceSort';

// Shared insert/edit dialog (type 1 第三者 / 2 綜合 + optional broker).
export default function InsuranceDialog({
  initial,
  onClose,
}: {
  initial?: InsuranceRecord;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { insuranceRecords, setInsuranceRecords } = useContext(InsuranceRecordContext);
  const [date, setDate] = useState('');
  const [type, setType] = useState(1);
  const [broker, setBroker] = useState('');
  const [fee, setFee] = useState('');

  useEffect(() => {
    setDate(initial?.date ?? '');
    setType(initial?.type ?? 1);
    setBroker(initial?.broker ?? '');
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
      broker: broker.trim(),
      fee: Number(fee),
    };
    if (!rec.date) {
      return alert('請選擇日期!');
    }
    if (insuranceRecords.some(r => r.date === rec.date && r.id !== (isEdit ? initial!.id : -1))) {
      return alert(`${rec.date} 已有保險記錄!`);
    }
    const done = (saved: InsuranceRecord) => {
      setInsuranceRecords(prev => {
        const rest = isEdit ? prev.filter(r => r.id !== initial!.id) : prev;
        return [...rest, saved].sort(compareInsuranceByDateDesc);
      });
      onClose();
    };
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateInsuranceRecord(currentVehicle, { ...rec, id })
        .then(() => done({ ...rec, id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addInsuranceRecord(currentVehicle, rec)
        .then(res => done({ ...rec, id: res.data?.id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯保險記錄' : '新增保險記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>保險種類
              <select value={type} onChange={handleChange(v => setType(Number(v)))}>
                {insuranceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.tc}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>保險公司 (選填)
              <input value={broker} onChange={handleChange(setBroker)} placeholder="保險公司" />
            </label>
            <label>保費 ($)
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
