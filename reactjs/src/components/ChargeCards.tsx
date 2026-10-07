import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteChargeRecord, type ChargeRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ChargeRecordContext } from '../contexts/ChargeRecordContext';

// Mobile card list for charge records (mirrors FuelRecordCards).
export default function ChargeCards({
  onEdit,
}: {
  onEdit: (record: ChargeRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { chargeRecords, setChargeRecords } = useContext(ChargeRecordContext);

  const handleDelete = (index: number) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!window.confirm('確認刪除記錄?')) return;

    const record = chargeRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteChargeRecord(currentVehicle, record)
      .then(() => {
        setChargeRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      });
  };

  return (
    <div className="cards">
      {chargeRecords.length === 0 ? (
        <h2>沒有記錄</h2>
      ) : (
        chargeRecords.map((record, i) => (
          <div className="card" key={record.id ?? record.odm}>
            <div className="card-info">
              <div className="card-title">{record.date} · {Number(record.odm)} km</div>
              <div>
                {Number(record.kwh).toFixed(2)} kWh · $ {Number(record.price).toFixed(2)} · ${' '}
                {Number(record.pricePerKwh ?? 0).toFixed(2)} / kWh
              </div>
            </div>
            <div className="card-side">
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
        ))
      )}
    </div>
  );
}
