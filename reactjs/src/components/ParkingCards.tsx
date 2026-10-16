import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteParkingRecord, type ParkingRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ParkingRecordContext } from '../contexts/ParkingRecordContext';
import { RentalTypeName } from '../types/Parking';
import ReceiptLink from './ReceiptLink';

// Mobile card list for parking visits (mirrors FuelRecordCards).
export default function ParkingCards({
  images,
  onEdit,
}: {
  images: Map<string, ImageInfo>;
  onEdit: (record: ParkingRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { parkingRecords, setParkingRecords } = useContext(ParkingRecordContext);

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = parkingRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteParkingRecord(currentVehicle, record)
      .then(() => {
        setParkingRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {parkingRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        parkingRecords.map((record, i) => {
          const receipt = images.get(String(record.id ?? 0));
          return (
          <div className="card" key={record.id ?? `${record.date}-${record.carpark}-${i}`}>
            <div className="card-info">
              <div className="card-title">{record.date} · {record.carpark}</div>
              <div>
                {RentalTypeName(record.rentalType)} · $ {Number(record.fee).toFixed(2)}
              </div>
            </div>
            <div className="card-side">
              <ReceiptLink receipt={receipt} label={`${record.date} ${record.carpark}`} />
              <button
                className="icon-button"
                title="編輯"
                aria-label={`編輯 ${record.date} ${record.carpark}記錄`}
                onClick={() => onEdit(record)}>
                ✏️
              </button>
              <button
                className="icon-button danger"
                title="刪除"
                aria-label={`刪除 ${record.date} ${record.carpark}記錄`}
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
