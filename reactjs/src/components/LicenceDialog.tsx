import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addLicenceRecord, deleteImage, updateLicenceRecord, uploadImage, type LicenceRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { LicenceRecordContext } from '../contexts/LicenceRecordContext';
import { licenceTypes } from '../types/DatedTypes';
import { compareLicenceByDateDesc } from '../utils/licenceSort';
import ReceiptField from './ReceiptField';
import type { CompressedImage } from '../utils/image';

// Shared insert/edit dialog (type 1 四個月 / 2 十二個月).
export default function LicenceDialog({
  initial,
  receiptImage,
  onImageChanged,
  onClose,
}: {
  initial?: LicenceRecord;
  receiptImage?: ImageInfo | null;
  onImageChanged?: () => void;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { licenceRecords, setLicenceRecords } = useContext(LicenceRecordContext);
  const [date, setDate] = useState('');
  const [type, setType] = useState(2);
  const [fee, setFee] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<CompressedImage | null>(null);
  const [pendingReceiptDelete, setPendingReceiptDelete] = useState(false);

  useEffect(() => {
    setDate(initial?.date ?? '');
    setType(initial?.type ?? 2);
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
        entityType: 'licence_record',
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
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateLicenceRecord(currentVehicle, { ...rec, id })
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
      addLicenceRecord(currentVehicle, rec)
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
