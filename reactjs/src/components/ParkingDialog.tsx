import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addParkingRecord, updateParkingRecord, type ParkingRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ParkingRecordContext } from '../contexts/ParkingRecordContext';
import { rentalTypes } from '../types/Parking';
import { compareParkingByDateDesc } from '../utils/parkingSort';

// Shared insert/edit dialog. Carpark is free text entry.
export default function ParkingDialog({
  initial,
  onClose,
}: {
  initial?: ParkingRecord;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { setParkingRecords } = useContext(ParkingRecordContext);
  const [date, setDate] = useState('');
  const [carpark, setCarpark] = useState('');
  const [rentalType, setRentalType] = useState(1);
  const [fee, setFee] = useState('');

  useEffect(() => {
    setDate(initial?.date ?? '');
    setCarpark(initial?.carpark ?? '');
    setRentalType(initial?.rentalType ?? 1);
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
      carpark: carpark.trim(),
      rentalType: Number(rentalType),
      fee: Number(fee),
    };
    if (!rec.date || !rec.carpark) {
      return alert('請輸入日期及停車場!');
    }
    const done = (saved: ParkingRecord) => {
      setParkingRecords(prev => {
        const rest = isEdit ? prev.filter(r => r.id !== initial!.id) : prev;
        return [...rest, saved].sort(compareParkingByDateDesc);
      });
      onClose();
    };
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateParkingRecord(currentVehicle, { ...rec, id })
        .then(() => done({ ...rec, id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addParkingRecord(currentVehicle, rec)
        .then(res => done({ ...rec, id: res.data?.id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯泊車記錄' : '新增泊車記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>收費模式
              <select value={rentalType} onChange={handleChange(v => setRentalType(Number(v)))}>
                {rentalTypes.map((r, i) => (
                  <option key={r.en} value={i + 1}>{r.tc}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>停車場
              <input value={carpark} onChange={handleChange(setCarpark)} placeholder="停車場" required />
            </label>
            <label>費用 ($)
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
