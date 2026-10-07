import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VehicleContext } from '../contexts/VehicleContext';
import { PageContext } from '../contexts/PageContext';
import { Page, pageIndexFromSlug, pageSlugs, isSlugForVehicle, defaultSlugForVehicle } from '../types/Page';
import { vehicleLabelOf, vehiclePlateOf, vehicleTypeOf } from '../types/Vehicle';
import FuelRecordPage from './FuelRecordPage';
import ChargePage from './ChargePage';
import TunnelPage from './TunnelPage';
import ParkingPage from './ParkingPage';
import FinePage from './FinePage';
import ServicePage from './ServicePage';
import InsurancePage from './InsurancePage';
import LicencePage from './LicencePage';
import SummaryPage from './SummaryPage';
import ComingSoonPage from './ComingSoonPage';
import VehicleDialog from '../components/VehicleDialog';

export default function VehicleRoutePage() {
  const { vehicleId, slug } = useParams();
  const navigate = useNavigate();
  const { vehicles, currentVehicle, setCurrentVehicle } = useContext(VehicleContext);
  const { currentPage, setCurrentPage } = useContext(PageContext);
  const [showEdit, setShowEdit] = useState(false);

  const decodedId: number | '' = vehicleId !== undefined && vehicleId !== '' && Number.isInteger(Number(vehicleId))
    ? Number(vehicleId)
    : '';
  const slugIndex = pageIndexFromSlug(slug);
  const validSlug = (pageSlugs as readonly string[]).includes(slug ?? '');

  // Sync URL -> context (vehicle + tab)
  useEffect(() => {
    if (decodedId !== '' && decodedId !== currentVehicle) setCurrentVehicle(decodedId);
    if (slugIndex !== currentPage) setCurrentPage(slugIndex);
  }, [decodedId, slugIndex, currentVehicle, currentPage, setCurrentVehicle, setCurrentPage]);

  // Unknown tab slug -> normalize to fuel tab
  useEffect(() => {
    if (vehicleId && !validSlug) navigate(`/vehicles/${vehicleId}/fuel`, { replace: true });
  }, [vehicleId, validSlug, navigate]);

  if (decodedId === '') return <h2>請選擇座駕</h2>;
  // Vehicles still loading is handled by parent; unknown id -> friendly message
  if (vehicles.length > 0 && !vehicles.some(v => v.id === decodedId)) {
    return (
      <div>
        <h2>找不到車輛 {decodedId}</h2>
        <p>請在上方重新選擇，或按新增註冊。</p>
      </div>
    );
  }

  // Electric vehicles use the charge tab instead of fuel (and vice versa).
  const currentType = vehicleTypeOf(vehicles, decodedId);
  if (vehicles.length > 0 && !isSlugForVehicle(slug, currentType)) {
    navigate(`/vehicles/${decodedId}/${defaultSlugForVehicle(currentType)}`, { replace: true });
    return null;
  }

  const plate = vehiclePlateOf(vehicles, decodedId);
  const current = vehicles.find(v => v.id === decodedId);
  // Summary tab: one-line title "{plate} {brand} {model} {year}" + edit button;
  // other tabs show "{plate}的{xxx}記錄".
  const heading = slugIndex === 0
    ? vehicleLabelOf(vehicles, decodedId)
    : `${plate}的${Page(slugIndex) ?? ''}記錄`;
  return (
    <div>
      <h1>{heading}{slugIndex === 0 && current && (
        <button className="icon-button" title="編輯座駕" aria-label="編輯座駕" onClick={() => setShowEdit(true)}>✏️</button>
      )}</h1>
      {showEdit && current && (
        <VehicleDialog
          initial={current}
          onClose={() => setShowEdit(false)}
        />
      )}
      {slug === 'fuel' ? (
        <FuelRecordPage />
      ) : slug === 'charge' ? (
        <ChargePage />
      ) : slug === 'tunnel' ? (
        <TunnelPage />
      ) : slug === 'parking' ? (
        <ParkingPage />
      ) : slug === 'fine' ? (
        <FinePage />
      ) : slug === 'service' ? (
        <ServicePage />
      ) : slug === 'insurance' ? (
        <InsurancePage />
      ) : slug === 'licence' ? (
        <LicencePage />
      ) : slug === 'summary' ? (
        <SummaryPage />
      ) : (
        <ComingSoonPage />
      )}
    </div>
  );
}
