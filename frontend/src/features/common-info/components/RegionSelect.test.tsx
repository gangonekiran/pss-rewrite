import { createRef } from 'react';

import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import type { RegionLookup } from '../../../types/common';

import RegionSelect from './RegionSelect';

const regions: RegionLookup[] = [
  { ID: 1, RName: 'North' },
  { ID: 2, RName: 'South' },
];

test('renders the placeholder followed by one option per region', async () => {
  const screen = await render(<RegionSelect regions={regions} />);

  const options = screen.getByRole('option');

  await expect.element(options.nth(0)).toHaveTextContent('Select region');
  await expect.element(options.nth(0)).toHaveValue('');
  await expect.element(options.nth(1)).toHaveTextContent('North');
  await expect.element(options.nth(1)).toHaveValue('1');
  await expect.element(options.nth(2)).toHaveTextContent('South');
  await expect.element(options.nth(2)).toHaveValue('2');

  expect(options.elements()).toHaveLength(3);
});

test('uses a custom placeholder text and value', async () => {
  const screen = await render(
    <RegionSelect regions={regions} placeholder="Choose" placeholderValue="0" />,
  );

  const placeholder = screen.getByRole('option', { name: 'Choose' });

  await expect.element(placeholder).toHaveValue('0');
  await expect.element(screen.getByRole('combobox')).toHaveValue('0');
});

test('renders only the placeholder when there are no regions', async () => {
  const screen = await render(<RegionSelect regions={[]} />);

  expect(screen.getByRole('option').elements()).toHaveLength(1);
});

test('works as a controlled select', async () => {
  // Read the value inside the handler: React restores a controlled
  // select to its value prop right after onChange.
  const onChange = vi.fn((event: React.ChangeEvent<HTMLSelectElement>) => event.target.value);

  const screen = await render(<RegionSelect regions={regions} value="2" onChange={onChange} />);

  const select = screen.getByRole('combobox');

  await expect.element(select).toHaveValue('2');

  await select.selectOptions('1');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.results[0].value).toBe('1');
});

test('passes select attributes through and forwards the ref', async () => {
  const ref = createRef<HTMLSelectElement>();

  const screen = await render(
    <RegionSelect ref={ref} regions={regions} name="Region" className="my-select" disabled />,
  );

  const select = screen.getByRole('combobox');

  await expect.element(select).toHaveAttribute('name', 'Region');
  await expect.element(select).toHaveClass('my-select');
  await expect.element(select).toBeDisabled();

  expect(ref.current).toBe(select.element());
});
