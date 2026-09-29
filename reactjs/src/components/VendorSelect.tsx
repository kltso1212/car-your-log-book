import type { ChangeEventHandler } from 'react';
import { vendors } from '../types/Vendor';

interface VendorSelectProps {
  name: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
}

export default function VendorSelect({ name, onChange }: VendorSelectProps) {
  return (
    <select name={name} onChange={onChange}>
      {vendors.map((v, i) => (
        <option key={i} value={i}>
          {v.tc}
        </option>
      ))}
    </select>
  );
}
