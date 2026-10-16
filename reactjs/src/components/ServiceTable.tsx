import type { MouseEvent } from 'react';
import { useContext } from 'react';
import { deleteServiceRecord, type ServiceRecord } from '../services/api';
import type { ImageInfo } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ServiceRecordContext } from '../contexts/ServiceRecordContext';
import { serviceItemName } from '../types/ServiceItems';
import { displayCustomList } from '../utils/customList';
import ReceiptLink from './ReceiptLink';
import TableHeader from './TableHeader';

const describe = (record: ServiceRecord): string => {
  const names = record.items.map(serviceItemName);
  const custom = displayCustomList(record.customItem);
  if (custom) names.push(custom);
  return names.join('、');
};

export default function ServiceTable({ images, onEdit }: {
  images: Map<string, ImageInfo>;
  onEdit: (record: ServiceRecord) => void;
}) {
  const { currentVehicle } = useContext(VehicleContext);
  const { serviceRecords, setServiceRecords } = useContext(ServiceRecordContext);

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm('確認刪除記錄?')) return;

    const index = Number(event.currentTarget.value);
    const record = serviceRecords.at(index);
    if (!record) return;

    if (currentVehicle === '') return;
    deleteServiceRecord(currentVehicle, record)
      .then(() => {
        setServiceRecords(prev => prev.filter((_, i) => i !== index));
      })
      .catch(err => {
        alert(err.response?.data?.message ?? err);
      })
  };

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={['日期', '行車哩數', '保養項目', '費用', '']} />
        <tbody>
          {serviceRecords.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <h2>沒有記錄</h2>
              </td>
            </tr>
          ) : (
            serviceRecords.map((record, i) => {
              const receipt = images.get(String(record.id ?? record.odm));
              return (
              <tr key={record.id ?? `${record.date}-${record.odm}`}>
                <td>{record.date}</td>
                <td>{Number(record.odm)} km</td>
                <td>{describe(record)}</td>
                <td>$ {Number(record.price).toFixed(2)}</td>
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
