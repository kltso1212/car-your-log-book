import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { pages, pageEmojis, pageSlugs, vehiclePath, isSlugForVehicle } from '../types/Page';
import { vehicleTypeOf } from '../types/Vehicle';
import { VehicleContext } from '../contexts/VehicleContext';

export default function NavigationBar() {
  const { vehicles, currentVehicle } = useContext(VehicleContext);
  const currentType = vehicleTypeOf(vehicles, currentVehicle);

  return (
    <nav className="tab-list" aria-label="主導航">
      {pages.map((p, i) => {
        const slug = pageSlugs[i]!;
        if (currentVehicle && !isSlugForVehicle(slug, currentType)) return null;
        const to = currentVehicle ? vehiclePath(currentVehicle, slug) : `/${slug}`;
        return (
          <NavLink
            key={p}
            to={to}
            className={({ isActive }) => `tab-button${isActive ? ' active' : ''}`}
          >
            <span role="img" aria-label={p}>{pageEmojis[i]}</span> {p}
          </NavLink>
        );
      })}
    </nav>
  );
}
