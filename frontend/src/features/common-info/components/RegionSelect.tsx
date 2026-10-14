import type { ComponentPropsWithRef } from 'react';

import type { RegionLookup } from '../../../types/common';

export interface RegionSelectProps extends Omit<ComponentPropsWithRef<'select'>, 'children'> {
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
 * register(), which passes a ref. In React 19 `ref` is a regular prop,
 * so no forwardRef is needed.
 */
export default function RegionSelect({
  regions,
  placeholder = 'Select region',
  placeholderValue = '',
  ref,
  ...selectProps
}: RegionSelectProps) {
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
}
