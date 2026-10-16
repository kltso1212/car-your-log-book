import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addTunnelRecord, deleteImage, updateTunnelRecord, uploadImage, type TunnelRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { TunnelRecordContext } from '../contexts/TunnelRecordContext';
import { tunnels } from '../types/Tunnel';
import { compareTunnelByDateDesc } from '../utils/tunnelSort';
import ReceiptField from './ReceiptField';
import type { CompressedImage } from '../utils/image';

// Shared insert/edit dialog. Tunnel picker drives the bound (方向) options;
// fee is free entry since tolls vary by vehicle class.
export default function TunnelDialog({
  initial,
  receiptImage,
  onImageChanged,
  onClose,
}: {
  initial?: TunnelRecord;
  receiptImage?: ImageInfo | null;
  onImageChanged?: () => void;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { setTunnelRecords } = useContext(TunnelRecordContext);
  const [date, setDate] = useState('');
  const [tunnel, setTunnel] = useState(tunnels[0]!.id);
  const [bound, setBound] = useState(1);
  const [fee, setFee] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<CompressedImage | null>(null);
  const [pendingReceiptDelete, setPendingReceiptDelete] = useState(false);

  useEffect(() => {
    setDate(initial?.date ?? '');
    setTunnel(initial?.tunnel ?? tunnels[0]!.id);
    setBound(initial?.bound ?? 1);
    setFee(initial ? String(initial.fee) : '');
    setPendingReceipt(null);
    setPendingReceiptDelete(false);
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

  const applyReceipt = async (entityId: number): Promise<void> => {
    if (pendingReceiptDelete) {
      if (receiptImage) await deleteImage(receiptImage.id);
    } else if (pendingReceipt) {
      await uploadImage(pendingReceipt, {
        entityType: 'tunnel_record',
        entityId,
        kind: 'receipt',
      });
    }
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
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateTunnelRecord(currentVehicle, { ...rec, id })
        .then(async () => {
          try {
            await applyReceipt(Number(id));
          } catch {
            alert('記錄已儲存，但收據未能更新，請再編輯記錄重試');
          }
          onImageChanged?.();
          done({ ...rec, id });
        })
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addTunnelRecord(currentVehicle, rec)
        .then(async res => {
          const newId = res.data?.id;
          if ((pendingReceipt || pendingReceiptDelete) && newId != null) {
            try {
              await applyReceipt(Number(newId));
            } catch {
              alert('記錄已儲存，但收據上載失敗，請編輯記錄重試');
            }
          }
          onImageChanged?.();
          done({ ...rec, id: res.data?.id });
        })
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
          <div className="form-row">
            <label>收據圖片
              <ReceiptField
                image={receiptImage}
                pending={pendingReceipt}
                pendingDelete={pendingReceiptDelete}
                onPick={compressed => {
                  setPendingReceipt(compressed);
                  setPendingReceiptDelete(false);
                }}
                onRemove={() => {
                  if (pendingReceipt) setPendingReceipt(null);
                  else setPendingReceiptDelete(true);
                }}
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
