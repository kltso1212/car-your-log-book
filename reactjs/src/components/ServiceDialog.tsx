import { useContext, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { addServiceRecord, deleteImage, updateServiceRecord, uploadImage, type ServiceRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ServiceRecordContext } from '../contexts/ServiceRecordContext';
import { allowedServiceItems, serviceItemGroups, serviceItemName } from '../types/ServiceItems';
import { vehicleTypeOf, DEFAULT_VEHICLE_TYPE } from '../types/Vehicle';
import { compareServiceByOdmDesc } from '../utils/serviceSort';
import { decodeCustomList, encodeCustomList } from '../utils/customList';
import { ItemSelectionBody, type PickerGroup } from './ItemSelectionBody';
import ReceiptField from './ReceiptField';
import type { CompressedImage } from '../utils/image';

// Shared insert/edit dialog (page-level button for add and edit). Items use
// the shared picker body: selected bubbles on top, grouped checkboxes, 其他 key-in.
export default function ServiceDialog({
  initial,
  receiptImage,
  onImageChanged,
  onClose,
}: {
  initial?: ServiceRecord;
  receiptImage?: ImageInfo | null;
  onImageChanged?: () => void;
  onClose: () => void;
}) {
  const isEdit = initial !== undefined;
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const { serviceRecords, setServiceRecords } = useContext(ServiceRecordContext);
  const vehicleType = vehicleTypeOf(vehicles, currentVehicle) ?? DEFAULT_VEHICLE_TYPE;
  const [date, setDate] = useState('');
  const [odm, setOdm] = useState('');
  const [items, setItems] = useState<number[]>([]);
  const [customs, setCustoms] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<CompressedImage | null>(null);
  const [pendingReceiptDelete, setPendingReceiptDelete] = useState(false);

  useEffect(() => {
    setDate(initial?.date ?? '');
    setOdm(initial ? String(initial.odm) : '');
    setItems(initial ? [...initial.items] : []);
    setCustoms(decodeCustomList(initial?.customItem));
    setPrice(initial ? String(initial.price) : '');
    setPendingReceipt(null);
    setPendingReceiptDelete(false);
  }, [initial]);

  const allowed = allowedServiceItems(vehicleType);
  const groups: PickerGroup[] = serviceItemGroups
    .map(g => ({
      title: g.title,
      options: g.ids
        .filter(id => allowed.includes(id))
        .map(id => ({ value: id, label: serviceItemName(id) })),
    }))
    .filter(g => g.options.length > 0);

  const handleChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setter(e.target.value);
    };

  const applyReceipt = async (entityId: number): Promise<void> => {
    if (pendingReceiptDelete) {
      if (receiptImage) await deleteImage(receiptImage.id);
    } else if (pendingReceipt) {
      await uploadImage(pendingReceipt, {
        entityType: 'service_record',
        entityId,
        kind: 'receipt',
      });
    }
  };

  const handleSave = (e: FormEvent): void => {
    e.preventDefault();
    const rec = {
      date,
      odm: Number(odm),
      items,
      customItem: encodeCustomList(customs),
      price: Number(price),
    };
    if (!rec.date || !rec.odm) {
      return alert('請輸入日期及行車哩數!');
    }
    if (serviceRecords.some(r => r.odm === rec.odm && r.id !== (isEdit ? initial!.id : -1))) {
      return alert(`${rec.odm} km 已有保養記錄!`);
    }
    const done = (saved: ServiceRecord) => {
      setServiceRecords(prev => {
        const rest = isEdit ? prev.filter(r => r.id !== initial!.id) : prev;
        return [...rest, saved].sort(compareServiceByOdmDesc);
      });
      onClose();
    };
    if (currentVehicle === '') return alert('請選擇座駕');
    if (isEdit) {
      const id = initial!.id;
      if (id === undefined) return alert('找不到記錄!');
      updateServiceRecord(currentVehicle, { ...rec, id })
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
      addServiceRecord(currentVehicle, rec)
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
          done({ ...rec, ...(newId != null ? { id: Number(newId) } : { id: rec.odm }) });
        })
        .catch(err => alert(err.response?.data?.message ?? err));
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? '編輯保養記錄' : '新增保養記錄'}</h2>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <label>日期
              <input type="date" value={date} onChange={handleChange(setDate)} required />
            </label>
            <label>行車哩數
              <input type="number" min="0" value={odm} onChange={handleChange(setOdm)} required />
            </label>
            <label>費用 ($)
              <input type="number" min="0" step="any" value={price} onChange={handleChange(setPrice)} />
            </label>
          </div>
          <ItemSelectionBody
            groups={groups}
            selected={items}
            customs={customs}
            onToggle={id =>
              setItems(prev => (prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]))
            }
            onRemoveCustom={i => setCustoms(prev => prev.filter((_, k) => k !== i))}
            onAddCustom={text => setCustoms(prev =>
              prev.some(c => c.trim().toLowerCase() === text.trim().toLowerCase())
                ? prev
                : [...prev, text]
            )}
            customPlaceholder="其他 (請註明)"
          />
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
