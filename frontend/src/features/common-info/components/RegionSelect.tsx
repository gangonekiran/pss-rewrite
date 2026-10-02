import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

import type { RegionLookup } from '../../../types/common';

export interface RegionSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Regions from commonInfoService.regions(). */
  regions: RegionLookup[];
  /** Text of the empty first option. */
  placeholder?: string;
  /** Value of the empty first option ('' for string forms, '0' for numeric ones). */
  placeholderValue?: string;
}

/**
 * Native region <select> shared by the input forms. Works both as a
 * controlled select (value/onChange) and with react-hook-form's
 * register(), which needs the forwarded ref.
 */
const RegionSelect = forwardRef<HTMLSelectElement, RegionSelectProps>(function RegionSelect(
  { regions, placeholder = 'Select region', placeholderValue = '', ...selectProps },
  ref,
) {
  return (
    <select ref={ref} {...selectProps}>
      <option value={placeholderValue}>{placeholder}</option>

      {regions.map((region) => (
        <option key={region.ID} value={region.ID}>
          {region.RName}
        </option>
      ))}
    </select>
  );
});

export default RegionSelect;
