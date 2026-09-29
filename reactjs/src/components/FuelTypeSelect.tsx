import type { ChangeEventHandler } from 'react';
import { fuelTypes } from '../types/FuelType';

interface FuelTypeSelectProps {
  name: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  allowed?: number[];
}

export default function FuelTypeSelect({ name, onChange, allowed }: FuelTypeSelectProps) {
  const indices = allowed ?? fuelTypes.map((_, i) => i);
  return (
    <select onChange={onChange} name={name} defaultValue={indices[0]}>
      {indices.map(i => (
        <option key={i} value={i}>
          {fuelTypes[i]?.tc ?? ''}
        </option>
      ))}
    </select>
  );
}
