import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addParkingRecord, deleteImage, updateParkingRecord, uploadImage, type ParkingRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ParkingRecordContext } from '../contexts/ParkingRecordContext';
import { rentalTypes } from '../types/Parking';
import { compareParkingByDateDesc } from '../utils/parkingSort';
import ReceiptField from './ReceiptField';
import type { CompressedImage } from '../utils/image';

// Shared insert/edit dialog. Carpark is free text entry.
export default function ParkingDialog({
  initial,
  receiptImage,
  onImageChanged,
  onClose,
}: {
  initial?: ParkingRecord;
  receiptImage?: ImageInfo | null;
  onImageChanged?: () => void;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { currentVehicle } = useContext(VehicleContext);
  const { setParkingRecords } = useContext(ParkingRecordContext);
  const [date, setDate] = useState('');
  const [carpark, setCarpark] = useState('');
  const [rentalType, setRentalType] = useState(1);
  const [fee, setFee] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<CompressedImage | null>(null);
  const [pendingReceiptDelete, setPendingReceiptDelete] = useState(false);

  useEffect(() => {
    setDate(initial?.date ?? '');
    setCarpark(initial?.carpark ?? '');
    setRentalType(initial?.rentalType ?? 1);
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
        entityType: 'parking_record',
        entityId,
        kind: 'receipt',
      });
    }
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
      addParkingRecord(currentVehicle, rec)
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
