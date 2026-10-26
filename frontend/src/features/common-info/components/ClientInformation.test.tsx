import { expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import ClientInformation from './ClientInformation';

const client = {
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: '123-45-6789',
  DOB: '2023-04-10T00:00:00.000Z',
};

test('shows the client details, region and referral date', async () => {
  const screen = await render(
    <ClientInformation client={client} regionName="St Albans" referralDate="2025-02-15" />,
  );

  await expect.element(screen.getByRole('heading', { name: 'Client Information' })).toBeVisible();
  await expect.element(screen.getByText('(Read Only)')).toBeVisible();
  for (const text of ['Austin', 'Jane', '123-45-6789', '04/10/2023', 'St Albans', '02/15/2025']) {
    await expect.element(screen.getByText(text, { exact: true })).toBeVisible();
  }
});

test('leaves out County and Status unless they are passed', async () => {
  const screen = await render(<ClientInformation client={client} />);

  await expect.element(screen.getByText('Child Last Name')).toBeVisible();
  expect(screen.getByText('County', { exact: true }).elements()).toHaveLength(0);
  expect(screen.getByText('Status', { exact: true }).elements()).toHaveLength(0);
});

test('shows County and Status when passed', async () => {
  const screen = await render(
    <ClientInformation client={client} county="Franklin" status={null} />,
  );

  await expect.element(screen.getByText('County', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Franklin', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Status', { exact: true })).toBeVisible();
});

test('shows a dash for missing values', async () => {
  const screen = await render(
    <ClientInformation client={{ LastName: null, FirstName: '', SS: null, DOB: null }} />,
  );

  await expect.element(screen.getByText('Child Last Name')).toBeVisible();
  // Last name, first name, SSN, DOB, region and referral date.
  expect(screen.getByText('—', { exact: true }).elements()).toHaveLength(6);
});
