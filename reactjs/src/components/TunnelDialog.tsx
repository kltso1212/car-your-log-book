import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addTunnelRecord, updateTunnelRecord, type TunnelRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import { tunnels } from '../types/Tunnel';
import { compareTunnelByDateDesc } from '../utils/tunnelSort';

// Shared insert/edit dialog. Tunnel picker drives the bound (方向) options;
// fee is free entry since tolls vary by vehicle class.
export default function TunnelDialog({
  initial,
  onClose,
}: {
  initial?: TunnelRecord;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { setTunnelRecords } = useContext(TunnelRecordContext);
  const [date, setDate] = useState('');
  const [tunnel, setTunnel] = useState(tunnels[0]!.id);
  const [bound, setBound] = useState(1);
  const [fee, setFee] = useState('');

  useEffect(() => {
    setDate(initial?.date ?? '');
    setTunnel(initial?.tunnel ?? tunnels[0]!.id);
    setBound(initial?.bound ?? 1);
    setFee(initial ? String(initial.fee) : '');
  }, [initial]);

  const boundOptions = tunnels.find(t => t.id === tunnel)?.bounds ?? [];
  useEffect(() => {
    if (!boundOptions[bound - 1]) setBound(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tunnel]);

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setter(e.target.value);
    };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const rec = {
      date,
      tunnel: Number(tunnel),
      bound: Number(bound),
      fee: Number(fee),
    };
    if (!rec.date) {
      return alert('請選擇日期!');
    }
    const done = (saved: TunnelRecord) => {
      setTunnelRecords(prev => {
        const rest = isEdit ? prev.filter(r => r.id !== initial!.id) : prev;
        return [...rest, saved].sort(compareTunnelByDateDesc);
      });
      onClose();
    };
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateTunnelRecord(currentVehicle, { ...rec, id })
        .then(() => done({ ...rec, id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addTunnelRecord(currentVehicle, rec)
        .then(res => done({ ...rec, id: res.data?.id }))
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯隧道記錄' : '新增隧道記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>隧道費 ($)
              <input type="number" min="0" step="any" value={fee} onChange={handleChange(setFee)} />
            </label>
          </div>
          <div className="form-row">
            <label>隧道
              <select value={tunnel} onChange={handleChange(v => setTunnel(Number(v)))}>
                {tunnels.map(t => (
                  <option key={t.id} value={t.id}>{t.tc}</option>
                ))}
              </select>
            </label>
            <label>方向
              <select value={bound} onChange={handleChange(v => setBound(Number(v)))}>
                {boundOptions.map((label, i) => (
                  <option key={label} value={i + 1}>{label}</option>
                ))}
              </select>
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
