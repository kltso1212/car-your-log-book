import { useState, useEffect, useContext } from 'react';
import type { ChangeEvent } from 'react';
import { addFuelRecord } from '../services/api';
import VendorSelect from './VendorSelect';
import FuelTypeSelect from './FuelTypeSelect';
import { FuelRecordContext } from '../contexts/FuelRecordContext';
import { VehicleContext } from '../contexts/VehicleContext';
import { DIESEL_FUEL_TYPE, fuelTypes } from '../types/FuelType';
import { DIESEL_TYPE, vehicleTypeOf } from '../types/Vehicle';
import { compareFuelByDateDesc } from '../utils/fuelSort';
import type { FuelRecord } from '../types';

const allowedFuelTypes = (t: number | undefined): number[] =>
  t === DIESEL_TYPE ? [DIESEL_FUEL_TYPE] : fuelTypes.map((_, i) => i).filter(i => i !== DIESEL_FUEL_TYPE);

export default function InsertFuelRecord() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const { fuelRecords, setFuelRecords } = useContext(FuelRecordContext);
  const allowed = allowedFuelTypes(vehicleTypeOf(vehicles, currentVehicle));
  const [newRecord, setNewRecord] = useState<FuelRecord & { pricePerLitre: number }>(
    { date: '', odm: 0, vendor: 0, fuelType: allowed[0] ?? 0, litre: 0, price: 0, pricePerLitre: 0 },
  );

  const handleInsert = (): void => {
    if (!newRecord.date || !newRecord.odm || !newRecord.litre || !newRecord.price) {
      return alert('請輸入有效記錄!');
    }

    if (fuelRecords.find(r => r.odm === newRecord.odm)) {
      return alert(`${newRecord.odm} km 已有入油記錄!`);
    }

    addFuelRecord(currentVehicle, newRecord)
      .then(() => {
        setFuelRecords(prev => [...prev, newRecord].sort(compareFuelByDateDesc));
      })
      .catch((err) => {
        alert(err.response.data.message ?? err);
      })
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    const key = name as keyof FuelRecord;
    const parsedValue = key === 'date' ? value : Number(value);

    setNewRecord(prev => ({
      ...prev,
      [key]: parsedValue,
    } as typeof prev));
  };

  useEffect(() => {
    const pricePerLitre = newRecord.litre ? newRecord.price / newRecord.litre : 0;
    setNewRecord(prev => ({ ...prev, pricePerLitre }));
  }, [newRecord.price, newRecord.litre]);

  // Re-clamp when switching vehicles (e.g. petrol -> diesel locks to 柴油).
  useEffect(() => {
    setNewRecord(prev => (allowed.includes(prev.fuelType) ? prev : { ...prev, fuelType: allowed[0] ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVehicle]);

  return (
    <tr>
      <td>
        <input type="date" name="date" value={newRecord.date} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <input type="number" min="0" name="odm" value={newRecord.odm} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <VendorSelect name="vendor" onChange={handleInputChange} />
      </td>
      <td>
        <FuelTypeSelect name="fuelType" onChange={handleInputChange} allowed={allowed} />
      </td>
      <td>
        <input type="number" min="0" name="litre" value={newRecord.litre} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>
        <input type="number" min="0" name="price" value={newRecord.price} onChange={handleInputChange} placeholder="0" />
      </td>
      <td>$ {Number(newRecord.pricePerLitre).toFixed(2)} / L</td>
      <td>
        <button className="icon-button" title="新增入油記錄" aria-label="新增入油記錄" onClick={handleInsert}>➕</button>
      </td>
    </tr>
  );
}
