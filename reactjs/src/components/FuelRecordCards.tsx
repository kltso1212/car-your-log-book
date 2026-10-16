import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteFuelRecord, recordKey } from '../services/api';
import type { ImageInfo } from '../services/api';
import { FuelType } from '../types/FuelType';
import { Vendor } from '../types/Vendor';
import { VehicleContext } from '../contexts/VehicleContext';
import { FuelRecordContext } from '../contexts/FuelRecordContext';
import ReceiptLink from './ReceiptLink';
import type { FuelRecord } from '../types';

// Mobile card list: used below the 768px breakpoint instead of FuelRecordTable.
export default function FuelRecordCards({
  images,
  onEdit,
}: {
  images: Map<string, ImageInfo>;
  onEdit: (record: FuelRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { fuelRecords, setFuelRecords } = useContext(FuelRecordContext);

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = fuelRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteFuelRecord(currentVehicle, record)
      .then(() => {
        setFuelRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {fuelRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        fuelRecords.map((record, i) => {
          const receipt = images.get(String(recordKey(record)));
          return (
          <div className="card" key={record.id ?? (record as { Id?: string | number }).Id ?? record.odm}>
            <div className="card-info">
              <div className="card-title">{record.date} · {Number(record.odm)} km</div>
              <div>{Vendor(record.vendor)?.tc ?? ''} · {FuelType(record.fuelType)?.tc ?? ''}</div>
              <div>
                {Number(record.litre).toFixed(2)} L · $ {Number(record.price).toFixed(2)} · ${' '}
                {Number(record.pricePerLitre ?? 0).toFixed(2)} / L
              </div>
            </div>
            <div className="card-side">
              <ReceiptLink receipt={receipt} label={`${record.date} ${record.odm} km`} />
              <button
                className="icon-button"
                title="編輯"
                aria-label={`編輯 ${record.date} ${record.odm} km 記錄`}
                onClick={() => onEdit(record)}>
                ✏️
              </button>
              <button
                className="icon-button danger"
                title="刪除"
                aria-label={`刪除 ${record.date} ${record.odm} km 記錄`}
                onClick={handleDelete(i)}>
                🗑️
              </button>
            </div>
          </div>
          );
        })
      )}
    </div>
  );
}
