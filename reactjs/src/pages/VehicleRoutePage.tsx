import { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VehicleContext } from '../contexts/VehicleContext';
import { PageContext } from '../contexts/PageContext';
import { Page, pageIndexFromSlug, pageSlugs, isSlugForVehicle, defaultSlugForVehicle } from '../types/Page';
import { vehicleTypeOf } from '../types/Vehicle';
import FuelRecordPage from './FuelRecordPage';
import ChargePage from './ChargePage';
import TunnelPage from './TunnelPage';
import SummaryPage from './SummaryPage';
import ComingSoonPage from './ComingSoonPage';

export default function VehicleRoutePage() {
  const { vehicleId, slug } = useParams();
  const navigate = useNavigate();
  const { vehicles, currentVehicle, setCurrentVehicle } = useContext(VehicleContext);
  const { currentPage, setCurrentPage } = useContext(PageContext);

  const decodedId = vehicleId ? decodeURIComponent(vehicleId) : '';
  const slugIndex = pageIndexFromSlug(slug);
  const validSlug = (pageSlugs as readonly string[]).includes(slug ?? '');

  // Sync URL -> context (vehicle + tab)
  useEffect(() => {
    if (decodedId && decodedId !== currentVehicle) setCurrentVehicle(decodedId);
    if (slugIndex !== currentPage) setCurrentPage(slugIndex);
  }, [decodedId, slugIndex, currentVehicle, currentPage, setCurrentVehicle, setCurrentPage]);

  // Unknown tab slug -> normalize to fuel tab
  useEffect(() => {
    if (vehicleId && !validSlug) navigate(`/vehicles/${vehicleId}/fuel`, { replace: true });
  }, [vehicleId, validSlug, navigate]);

  if (!decodedId) return <h2>請選擇座駕</h2>;
  // Vehicles still loading is handled by parent; unknown plate -> friendly message
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
    navigate(`/vehicles/${vehicleId}/${defaultSlugForVehicle(currentType)}`, { replace: true });
    return null;
  }

  return (
    <div>
      {decodedId && <h1>{decodedId}的{Page(slugIndex) ?? ''}記錄</h1>}
      {slug === 'fuel' ? (
        <FuelRecordPage />
      ) : slug === 'charge' ? (
        <ChargePage />
      ) : slug === 'tunnel' ? (
        <TunnelPage />
      ) : slug === 'summary' ? (
        <SummaryPage />
      ) : (
        <ComingSoonPage />
      )}
    </div>
  );
}
