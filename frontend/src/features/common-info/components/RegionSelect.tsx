import type { ComponentPropsWithRef } from 'react';

import type { RegionLookup } from '../../../types/common';

export interface RegionSelectProps extends Omit<ComponentPropsWithRef<'select'>, 'children'> {
  id: string;
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
 * register(), which needs the ref.
 */
export default function RegionSelect({
  id,
  regions,
  placeholder = 'Select region',
  placeholderValue = '',
  ref,
  ...selectProps
}: RegionSelectProps) {
  return (
    <select id={id} ref={ref} {...selectProps}>
      <option value={placeholderValue}>{placeholder}</option>

      {regions.map((region) => (
        <option key={region.ID} value={region.ID}>
          {region.RName}
        </option>
      ))}
    </select>
  );
}
