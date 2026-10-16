import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteFuelRecord, recordKey } from '../services/api';
import type { ImageInfo } from '../services/api';
import { FuelType } from '../types/FuelType';
import { Vendor } from '../types/Vendor';
import { VehicleContext } from '../contexts/VehicleContext';
import { FuelRecordContext } from '../contexts/FuelRecordContext';
import ReceiptLink from './ReceiptLink';
import TableHeader from './TableHeader';

import type { FuelRecord } from '../types';

export default function FuelRecordTable({
  images,
  onEdit,
}: {
  images: Map<string, ImageInfo>;
  onEdit: (record: FuelRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { fuelRecords, setFuelRecords } = useContext(FuelRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = fuelRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteFuelRecord(currentVehicle, record)
      .then(() => {
        setFuelRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['入油日期', '行車哩數', '油公司', '汽油種類', '入油量', '總價錢', '每公升油價', '']} />
        <tbody>
          {fuelRecords.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            fuelRecords.map((record, i) => {
              const receipt = images.get(String(recordKey(record)));
              return (
              <tr key={record.id ?? record.Id ?? record.odm}>
                <td>{record.date}</td>
                <td>{Number(record.odm)} km</td>
                <td>{Vendor(record.vendor)?.tc ?? ''}</td>
                <td>{FuelType(record.fuelType)?.tc ?? ''}</td>
                <td>{Number(record.litre).toFixed(2)} L</td>
                <td>$ {Number(record.price).toFixed(2)}</td>
                <td>$ {Number(record.pricePerLitre ?? 0).toFixed(2)} / L</td>
                <td className="row-actions">
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
                    onClick={handleDelete} value={i}>
                    🗑️
                  </button>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
