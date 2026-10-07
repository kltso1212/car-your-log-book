import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addVehicle, updateVehicle } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import {
  isValidYear,
  normalizeVehicleType,
  vehicleBrands,
  vehicleTypes,
  OTHER_BRAND,
  DEFAULT_VEHICLE_TYPE,
  type Vehicle,
  type VehicleType,
} from '../types/Vehicle';

// Seed brand for the dropdown: known brands select directly, anything else
// flips to 其他 with the free-text box holding the original value.
const brandSeed = (v?: Vehicle): { brand: string; customBrand: string } => {
  const b = v?.brand ?? '';
  if (b === '' || vehicleBrands.includes(b)) return { brand: b, customBrand: '' };
  return { brand: OTHER_BRAND, customBrand: b };
};

// Shared insert/edit dialog for vehicles (same convention as the record
// dialogs: isEdit = initial !== undefined). Type is editable in both modes.
// On insert the parent gets onInserted(id) so it can navigate to the new car.
export default function VehicleDialog({
  initial,
  onClose,
  onInserted,
}: {
  initial?: Vehicle;
  onClose: () => void;
  onInserted?: (id: number) => void;
}) {
  const isEdit = initial !== undefined;
  const { setVehicles, setCurrentVehicle } = useContext(VehicleContext);
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [type, setType] = useState<VehicleType>(initial?.type ?? DEFAULT_VEHICLE_TYPE);
  const [{ brand, customBrand }, setBrandSeed] = useState(() => brandSeed(initial));
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial?.year === null || initial?.year === undefined ? '' : String(initial.year));

  useEffect(() => {
    setPlate(initial?.plate ?? '');
    setType(initial?.type ?? DEFAULT_VEHICLE_TYPE);
    setBrandSeed(brandSeed(initial));
    setModel(initial?.model ?? '');
    setYear(initial?.year === null || initial?.year === undefined ? '' : String(initial.year));
  }, [initial]);

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setter(e.target.value);
    };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const normPlate = plate.trim().toUpperCase();
    if (!normPlate) return alert('請輸入車牌');
    const normBrand = brand === OTHER_BRAND ? customBrand.trim() : brand;
    const normModel = model.trim();
    const normYear = year.trim() === '' ? null : Number(year);
    if (!isValidYear(normYear)) return alert('年份無效');
    const rec = { plate: normPlate, type, brand: normBrand, model: normModel, year: normYear };

    if (isEdit) {
      const id = initial!.id;
      updateVehicle(id, rec)
        .then(() => {
          setVehicles(prev => prev.map(v => (v.id === id ? { id, ...rec } : v)));
          onClose();
        })
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addVehicle(rec)
        .then(res => {
          const id = res.data?.id;
          if (typeof id !== 'number') return alert('新增失敗，請重新載入');
          setVehicles(prev => [...prev, { id, ...rec }].sort((a, b) => a.id - b.id));
          setCurrentVehicle(id);
          onInserted?.(id);
          onClose();
        })
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯座駕' : '新增座駕'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>車牌
              <input
                value={plate}
                onChange={handleChange(setPlate)}
                placeholder="車牌"
                autoFocus
                required
              />
            </label>
            <label>車輛類別
              <select value={type} onChange={e => setType(normalizeVehicleType(Number(e.target.value)))}>
                {vehicleTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.tc}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>品牌
              <select value={brand} onChange={handleChange(v => setBrandSeed(s => ({ ...s, brand: v })))}>
                <option value="">-- 請選擇 --</option>
                {vehicleBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value={OTHER_BRAND}>其他（請註明）</option>
              </select>
            </label>
            {brand === OTHER_BRAND && (
              <label>請註明品牌
                <input
                  value={customBrand}
                  onChange={handleChange(v => setBrandSeed(s => ({ ...s, customBrand: v })))}
                  placeholder="品牌"
                />
              </label>
            )}
          </div>
          <div className="form-row">
            <label>型號
              <input
                value={model}
                onChange={handleChange(setModel)}
                placeholder="型號"
              />
            </label>
            <label>年份
              <input
                value={year}
                onChange={handleChange(setYear)}
                placeholder="年份"
                inputMode="numeric"
              />
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
