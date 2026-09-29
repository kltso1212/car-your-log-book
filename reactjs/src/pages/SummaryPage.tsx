import { useState, useEffect, useMemo, useContext } from 'react';
import { getChargeRecords, getFuelRecords, type ChargeRecord } from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ELECTRIC_TYPE } from '../types/Page';
import { vehicleTypeOf } from '../types/Vehicle';
import { averageConsumption, averagePowerConsumption, maxOdmRecord } from '../utils/fuelStats';
import type { FuelRecord } from '../types';

// 總覽: per-vehicle dashboard. Insurance / licence expiry are placeholders
// until those record pages land.
export default function SummaryPage() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const isElectric = vehicleTypeOf(vehicles, currentVehicle) === ELECTRIC_TYPE;
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentVehicle) {
      setFuelRecords([]);
      setChargeRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([getFuelRecords(currentVehicle), getChargeRecords(currentVehicle)])
      .then(([fuel, charge]) => {
        setFuelRecords(fuel.data || []);
        setChargeRecords(charge.data || []);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setFuelRecords([]);
        setChargeRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  const latest = useMemo(() => maxOdmRecord([...fuelRecords, ...chargeRecords]), [fuelRecords, chargeRecords]);
  const consumption = useMemo(() => averageConsumption(fuelRecords), [fuelRecords]);
  const power = useMemo(() => averagePowerConsumption(chargeRecords), [chargeRecords]);
  const shown = isElectric ? power : consumption;

  if (loading) return <h2>正在載入...</h2>;

  return (
    <dl className="summary">
      <div className="summary-row">
        <dt>現時行車哩數</dt>
        <dd>
          {latest ? (
            <>
              {latest.odm} km
              <span className="sub">最近更新：{latest.date}</span>
            </>
          ) : (
            '沒有記錄'
          )}
        </dd>
      </div>
      <div className="summary-row">
        <dt>{isElectric ? '平均電耗' : '平均油耗'}</dt>
        <dd>{shown !== 0 ? `$ ${shown.toFixed(2)} / km` : '沒有記錄'}</dd>
      </div>
      <div className="summary-row">
        <dt>保險到期日</dt>
        <dd className="placeholder">尚未設定</dd>
      </div>
      <div className="summary-row">
        <dt>牌費到期日</dt>
        <dd className="placeholder">尚未設定</dd>
      </div>
    </dl>
  );
}
