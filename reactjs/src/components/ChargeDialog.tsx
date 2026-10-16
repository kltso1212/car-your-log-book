import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addChargeRecord, deleteImage, updateChargeRecord, uploadImage, type ChargeRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ChargeRecordContext } from '../contexts/ChargeRecordContext';
import { compareChargeByDateDesc } from '../utils/chargeSort';
import ReceiptField from './ReceiptField';
import type { CompressedImage } from '../utils/image';

// Shared insert/edit dialog for charge records (electric vehicles only).
export default function ChargeDialog({
  initial,
  receiptImage,
  onImageChanged,
  onClose,
}: {
  initial?: ChargeRecord;
  receiptImage?: ImageInfo | null;
  onImageChanged?: () => void;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { chargeRecords, setChargeRecords } = useContext(ChargeRecordContext);
  const [date, setDate] = useState('');
  const [odm, setOdm] = useState('');
  const [kwh, setKwh] = useState('');
  const [price, setPrice] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<CompressedImage | null>(null);
  const [pendingReceiptDelete, setPendingReceiptDelete] = useState(false);

  useEffect(() => {
    setDate(initial?.date ?? '');
    setOdm(initial ? String(initial.odm) : '');
    setKwh(initial ? String(initial.kwh) : '');
    setPrice(initial ? String(initial.price) : '');
    setPendingReceipt(null);
    setPendingReceiptDelete(false);
  }, [initial]);

  const kwhNum = Number(kwh);
  const priceNum = Number(price);
  const unitPrice = kwhNum > 0 ? priceNum / kwhNum : 0;

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setter(e.target.value);
    };

  const chargeKey = (r: ChargeRecord): string | number => r.id ?? r.odm;

  const applyReceipt = async (entityId: number): Promise<void> => {
    if (pendingReceiptDelete) {
      if (receiptImage) await deleteImage(receiptImage.id);
    } else if (pendingReceipt) {
      await uploadImage(pendingReceipt, {
        entityType: 'charge_record',
        entityId,
        kind: 'receipt',
      });
    }
  };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const rec: ChargeRecord = {
      ...(isEdit ? { id: chargeKey(initial!) } : {}),
      date,
      odm: Number(odm),
      kwh: Number(kwh),
      price: Number(price),
    };
    if (!rec.date || !rec.odm || !rec.kwh || !rec.price) {
      return alert('請輸入有效記錄!');
    }
    if (chargeRecords.some(r => r.odm === rec.odm && chargeKey(r) !== (isEdit ? chargeKey(initial!) : -1))) {
      return alert(`${rec.odm} km 已有充電記錄!`);
    }
    const done = (saved: ChargeRecord) => {
      setChargeRecords(prev => {
        const rest = isEdit ? prev.filter(r => chargeKey(r) !== chargeKey(initial!)) : prev;
        return [...rest, saved].sort(compareChargeByDateDesc);
      });
      onClose();
    };
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      updateChargeRecord(currentVehicle, rec)
        .then(async () => {
          try {
            await applyReceipt(Number(chargeKey(initial!)));
          } catch {
            alert('記錄已儲存，但收據未能更新，請再編輯記錄重試');
          }
          onImageChanged?.();
          done({ ...rec, pricePerKwh: unitPrice });
        })
        .catch(err => alert(err.response?.data?.message ?? err));
    } else {
      addChargeRecord(currentVehicle, rec)
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
          done({ ...rec, ...(newId != null ? { id: Number(newId) } : {}), pricePerKwh: unitPrice });
        })
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯充電記錄' : '新增充電記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>充電日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>行車哩數
              <input type="number" min="0" value={odm} onChange={handleChange(setOdm)} required />
            </label>
          </div>
          <div className="form-row">
            <label>充電量 (kWh)
              <input type="number" min="0" step="any" value={kwh} onChange={handleChange(setKwh)} required />
            </label>
            <label>總價錢 ($)
              <input type="number" min="0" step="any" value={price} onChange={handleChange(setPrice)} required />
            </label>
            <span className="unit-box">$ {unitPrice.toFixed(2)} / kWh</span>
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
