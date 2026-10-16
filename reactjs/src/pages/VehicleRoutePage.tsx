import { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VehicleContext } from '../contexts/VehicleContext';
import { PageContext } from '../contexts/PageContext';
import { Page, pageIndexFromSlug, pageSlugs, isSlugForVehicle } from '../types/Page';
import { vehiclePlateOf, vehicleTypeOf } from '../types/Vehicle';
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

export default function VehicleRoutePage() {
  const { vehicleId, slug } = useParams();
  const navigate = useNavigate();
  const { vehicles, currentVehicle, setCurrentVehicle } = useContext(VehicleContext);
  const { currentPage, setCurrentPage } = useContext(PageContext);

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

  // Tab no longer valid for the vehicle type (e.g. fuel tab on an electric
  // vehicle after editing its type) -> land on the summary tab instead.
  const currentType = vehicleTypeOf(vehicles, decodedId);
  if (vehicles.length > 0 && !isSlugForVehicle(slug, currentType)) {
    navigate(`/vehicles/${decodedId}/summary`, { replace: true });
    return null;
  }

  const plate = vehiclePlateOf(vehicles, decodedId);
  // Summary tab has no heading (the identity bar above shows the vehicle
  // name); other tabs show "{plate}的{xxx}記錄".
  const heading = `${plate}的${Page(slugIndex) ?? ''}記錄`;
  return (
    <div>
      {slugIndex !== 0 && (
        <h2>{heading}</h2>
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
