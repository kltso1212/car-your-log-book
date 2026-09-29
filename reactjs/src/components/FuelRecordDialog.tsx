import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addFuelRecord, recordKey, updateFuelRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { FuelRecordContext } from '../contexts/FuelRecordContext';
import { vendors } from '../types/Vendor';
import { DIESEL_FUEL_TYPE, fuelTypes } from '../types/FuelType';
import { DIESEL_TYPE, vehicleTypeOf } from '../types/Vehicle';
import { compareFuelByDateDesc } from '../utils/fuelSort';
import type { FuelRecord } from '../types';

// Diesel vehicles lock to fuel type 2 (柴油); all others use the rest.
const allowedFuelTypes = (t: number | undefined): number[] =>
  t === DIESEL_TYPE ? [DIESEL_FUEL_TYPE] : fuelTypes.map((_, i) => i).filter(i => i !== DIESEL_FUEL_TYPE);

// Shared insert/edit dialog (same 3-row layout as the android dialog).
// PC table uses it for edit only; mobile cards use it for both add and edit.
export default function FuelRecordDialog({
  initial,
  onClose,
}: {
  initial?: FuelRecord;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const { fuelRecords, setFuelRecords } = useContext(FuelRecordContext);
  const [date, setDate] = useState('');
  const [odm, setOdm] = useState('');
  const [vendor, setVendor] = useState(0);
  const [fuelType, setFuelType] = useState(0);
  const [litre, setLitre] = useState('');
  const [price, setPrice] = useState('');

  const allowed = allowedFuelTypes(vehicleTypeOf(vehicles, currentVehicle));

  useEffect(() => {
    setDate(initial?.date ?? '');
    setOdm(initial ? String(initial.odm) : '');
    setVendor(initial?.vendor ?? 0);
    setFuelType(allowed.includes(initial?.fuelType ?? -1) ? initial!.fuelType : allowed[0]!);
    setLitre(initial ? String(initial.litre) : '');
    setPrice(initial ? String(initial.price) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const litreNum = Number(litre);
  const priceNum = Number(price);
  const unitPrice = litreNum > 0 ? priceNum / litreNum : 0;

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setter(e.target.value);
    };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const rec: FuelRecord = {
      ...(isEdit ? { id: recordKey(initial!) } : {}),
      date,
      odm: Number(odm),
      vendor: Number(vendor),
      fuelType: Number(fuelType),
      litre: Number(litre),
      price: Number(price),
    };
    if (!rec.date || !rec.odm || !rec.litre || !rec.price) {
      return alert('請輸入有效記錄!');
    }
    if (fuelRecords.some(r => r.odm === rec.odm && recordKey(r) !== (isEdit ? recordKey(initial!) : -1))) {
      return alert(`${rec.odm} km 已有入油記錄!`);
    }
    const done = (saved: FuelRecord) => {
      setFuelRecords(prev => {
        const rest = isEdit ? prev.filter(r => recordKey(r) !== recordKey(initial!)) : prev;
        return [...rest, saved].sort(compareFuelByDateDesc);
      });
      onClose();
    };
    if (isEdit) {
      updateFuelRecord(currentVehicle, rec)
        .then(() => done({ ...rec, pricePerLitre: unitPrice }))
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addFuelRecord(currentVehicle, rec)
        .then(() => done({ ...rec, pricePerLitre: unitPrice }))
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯入油記錄' : '新增入油記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>入油日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>行車哩數
              <input type="number" min="0" value={odm} onChange={handleChange(setOdm)} required />
            </label>
          </div>
          <div className="form-row">
            <label>油公司
              <select value={vendor} onChange={handleChange(v => setVendor(Number(v)))}>
                {vendors.map((v, i) => (
                  <option key={v.en} value={i}>{v.tc}</option>
                ))}
              </select>
            </label>
            <label>汽油種類
              <select value={fuelType} onChange={handleChange(v => setFuelType(Number(v)))}>
                {allowed.map(i => (
                  <option key={fuelTypes[i]!.en} value={i}>{fuelTypes[i]!.tc}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>入油量 (L)
              <input type="number" min="0" step="any" value={litre} onChange={handleChange(setLitre)} required />
            </label>
            <label>總價錢 ($)
              <input type="number" min="0" step="any" value={price} onChange={handleChange(setPrice)} required />
            </label>
            <span className="unit-box">$ {unitPrice.toFixed(2)} / L</span>
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
