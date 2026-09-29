import { useState, useEffect, useContext } from 'react';
import type { ChangeEvent } from 'react';
import { addChargeRecord, type ChargeRecord } from '../services/api';
import { ChargeRecordContext } from '../contexts/ChargeRecordContext';
import { VehicleContext } from '../contexts/VehicleContext';
import { compareChargeByDateDesc } from '../utils/chargeSort';

export default function ChargeInsertRow() {
  const { currentVehicle } = useContext(VehicleContext);
  const { chargeRecords, setChargeRecords } = useContext(ChargeRecordContext);
  const [newRecord, setNewRecord] = useState<ChargeRecord & { pricePerKwh: number }>(
    { date: '', odm: 0, kwh: 0, price: 0, pricePerKwh: 0 },
  );

  const handleInsert = (): void => {
    if (!newRecord.date || !newRecord.odm || !newRecord.kwh || !newRecord.price) {
      return alert('請輸入有效記錄!');
    }

    if (chargeRecords.find(r => r.odm === newRecord.odm)) {
      return alert(`${newRecord.odm} km 已有充電記錄!`);
    }

    addChargeRecord(currentVehicle, newRecord)
      .then(() => {
        setChargeRecords(prev => [...prev, newRecord].sort(compareChargeByDateDesc));
      })
      .catch((err) => {
        alert(err.response.data.message ?? err);
      })
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    const key = name as keyof ChargeRecord;
    const parsedValue = key === 'date' ? value : Number(value);

    setNewRecord(prev => ({
      ...prev,
      [key]: parsedValue,
    } as typeof prev));
  };

  useEffect(() => {
    const pricePerKwh = newRecord.kwh ? newRecord.price / newRecord.kwh : 0;
    setNewRecord(prev => ({ ...prev, pricePerKwh }));
  }, [newRecord.price, newRecord.kwh]);

  return (
    <tr>
      <td>
        <input type="date" name="date" value={newRecord.date} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <input type="number" min="0" name="odm" value={newRecord.odm} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <input type="number" min="0" step="any" name="kwh" value={newRecord.kwh} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <input type="number" min="0" step="any" name="price" value={newRecord.price} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>$ {Number(newRecord.pricePerKwh).toFixed(2)} / kWh</td>
      <td>
        <button className="icon-button" title="新增充電記錄" aria-label="新增充電記錄" onClick={handleInsert}>➕</button>
      </td>
    </tr>
  );
}
