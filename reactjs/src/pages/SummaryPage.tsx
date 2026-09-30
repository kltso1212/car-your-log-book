import { useState, useEffect, useMemo, useContext } from 'react';
import {
  getChargeRecords,
  getFuelRecords,
  getInsuranceRecords,
  getLicenceRecords,
  getServiceRecords,
  type ChargeRecord,
  type InsuranceRecord,
  type LicenceRecord,
  type ServiceRecord,
} from '../services/api';
import { VehicleContext } from '../contexts/VehicleContext';
import { ELECTRIC_TYPE } from '../types/Page';
import { vehicleTypeOf } from '../types/Vehicle';
import { averageConsumption, averagePowerConsumption, maxOdmRecord } from '../utils/fuelStats';
import { insuranceExpiry, licenceExpiry } from '../utils/expiry';
import type { FuelRecord } from '../types';

// 總覽: per-vehicle dashboard. Expiry dates compute from the latest
// insurance/licence rows (+1yr/-1day and +term/-1day respectively).
export default function SummaryPage() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const isElectric = vehicleTypeOf(vehicles, currentVehicle) === ELECTRIC_TYPE;
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceRecord[]>([]);
  const [licenceRecords, setLicenceRecords] = useState<LicenceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentVehicle) {
      setFuelRecords([]);
      setChargeRecords([]);
      setServiceRecords([]);
      setInsuranceRecords([]);
      setLicenceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      getFuelRecords(currentVehicle),
      getChargeRecords(currentVehicle),
      getServiceRecords(currentVehicle),
      getInsuranceRecords(currentVehicle),
      getLicenceRecords(currentVehicle),
    ])
      .then(([fuel, charge, service, insurance, licence]) => {
        setFuelRecords(fuel.data || []);
        setChargeRecords(charge.data || []);
        setServiceRecords(service.data || []);
        setInsuranceRecords(insurance.data || []);
        setLicenceRecords(licence.data || []);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setFuelRecords([]);
        setChargeRecords([]);
        setServiceRecords([]);
        setInsuranceRecords([]);
        setLicenceRecords([]);
      })
      .finally(() => setLoading(false));
  }, [currentVehicle]);

  const latest = useMemo(
    () => maxOdmRecord([...fuelRecords, ...chargeRecords, ...serviceRecords]),
    [fuelRecords, chargeRecords, serviceRecords],
  );
  const consumption = useMemo(() => averageConsumption(fuelRecords), [fuelRecords]);
  const power = useMemo(() => averagePowerConsumption(chargeRecords), [chargeRecords]);
  const shown = isElectric ? power : consumption;
  const insuranceDue = useMemo(() => insuranceExpiry(insuranceRecords), [insuranceRecords]);
  const licenceDue = useMemo(() => licenceExpiry(licenceRecords), [licenceRecords]);

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
        <dd className={insuranceDue ? undefined : 'placeholder'}>{insuranceDue || '尚未設定'}</dd>
      </div>
      <div className="summary-row">
        <dt>牌費到期日</dt>
        <dd className={licenceDue ? undefined : 'placeholder'}>{licenceDue || '尚未設定'}</dd>
      </div>
    </dl>
  );
}
