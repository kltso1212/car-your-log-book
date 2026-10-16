import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addInsuranceRecord, deleteImage, updateInsuranceRecord, uploadImage, type InsuranceRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { InsuranceRecordContext } from '../contexts/InsuranceRecordContext';
import { insuranceTypes } from '../types/DatedTypes';
import { compareInsuranceByDateDesc } from '../utils/insuranceSort';
import ReceiptField from './ReceiptField';
import type { CompressedImage } from '../utils/image';

// Shared insert/edit dialog (type 1 第三者 / 2 綜合 + optional broker).
export default function InsuranceDialog({
  initial,
  receiptImage,
  onImageChanged,
  onClose,
}: {
  initial?: InsuranceRecord;
  receiptImage?: ImageInfo | null;
  onImageChanged?: () => void;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { insuranceRecords, setInsuranceRecords } = useContext(InsuranceRecordContext);
  const [date, setDate] = useState('');
  const [type, setType] = useState(1);
  const [broker, setBroker] = useState('');
  const [fee, setFee] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<CompressedImage | null>(null);
  const [pendingReceiptDelete, setPendingReceiptDelete] = useState(false);

  useEffect(() => {
    setDate(initial?.date ?? '');
    setType(initial?.type ?? 1);
    setBroker(initial?.broker ?? '');
    setFee(initial ? String(initial.fee) : '');
    setPendingReceipt(null);
    setPendingReceiptDelete(false);
  }, [initial]);

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
        entityType: 'insurance_record',
        entityId,
        kind: 'receipt',
      });
    }
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
      addInsuranceRecord(currentVehicle, rec)
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
