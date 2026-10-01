import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import type { RegionLookup } from '../../../../types';
import type { Client } from '../../../../types/client';

import ClientTabs from './ClientTabs';

/*
 * Child panels are mocked so these tests verify only ClientTabs behavior:
 * which tab is shown and which props are passed down.
 */
vi.mock('../ClientStatus/ClientStatus', () => ({
  default: ({ client }: { client: { childId?: number } }) => (
    <div data-testid="client-status-panel">Mock status panel for {String(client.childId)}</div>
  ),
}));

vi.mock('../InputForm/InputForms', () => ({
  default: ({ childId, regions }: { childId?: number; regions: unknown[] }) => (
    <div data-testid="input-forms-panel">
      Mock forms panel for {String(childId)} with {regions.length} regions
    </div>
  ),
}));

const createClient = (overrides: Partial<Client> = {}): Client => ({
  childId: 123,
  region: 1,
  lastName: 'Smith',
  firstName: 'John',
  ss: '123-45-6789',
  ssTemp: false,
  dob: '2020-01-01',
  gender: 'M',
  notes: '',
  nonEarlyIntervention: false,
  ...overrides,
});

const regions = [
  { ID: 1, RName: 'Region 1' },
  { ID: 2, RName: 'Region 2' },
] as RegionLookup[];

async function renderClientTabs(client = createClient()) {
  const screen = await render(<ClientTabs client={client} regions={regions} />);

  return { screen };
}

test('renders both tab buttons', async () => {
  const { screen } = await renderClientTabs();

  await expect.element(screen.getByRole('button', { name: 'Client Status' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Input Forms' })).toBeVisible();
});

test('shows the Client Status tab by default', async () => {
  const { screen } = await renderClientTabs();

  await expect.element(screen.getByTestId('client-status-panel')).toBeVisible();
  await expect.element(screen.getByTestId('input-forms-panel')).not.toBeInTheDocument();
});

test('passes the client to ClientStatus', async () => {
  const { screen } = await renderClientTabs(createClient({ childId: 456 }));

  await expect
    .element(screen.getByTestId('client-status-panel'))
    .toHaveTextContent('Mock status panel for 456');
});

test('marks Client Status as the active tab by default', async () => {
  const { screen } = await renderClientTabs();

  await expect
    .element(screen.getByRole('button', { name: 'Client Status' }))
    .toHaveClass('border-green-700');

  await expect
    .element(screen.getByRole('button', { name: 'Input Forms' }))
    .toHaveClass('border-transparent');
});

test('switches to Input Forms when its tab is clicked', async () => {
  const { screen } = await renderClientTabs();

  await screen.getByRole('button', { name: 'Input Forms' }).click();

  await expect.element(screen.getByTestId('input-forms-panel')).toBeVisible();
  await expect.element(screen.getByTestId('client-status-panel')).not.toBeInTheDocument();
});

test('passes childId and regions to InputForms', async () => {
  const { screen } = await renderClientTabs(createClient({ childId: 789 }));

  await screen.getByRole('button', { name: 'Input Forms' }).click();

  await expect
    .element(screen.getByTestId('input-forms-panel'))
    .toHaveTextContent('Mock forms panel for 789 with 2 regions');
});

test('passes an undefined childId to InputForms for a new client', async () => {
  const { screen } = await renderClientTabs(createClient({ childId: undefined }));

  await screen.getByRole('button', { name: 'Input Forms' }).click();

  await expect
    .element(screen.getByTestId('input-forms-panel'))
    .toHaveTextContent('Mock forms panel for undefined with 2 regions');
});

test('marks Input Forms as the active tab after switching', async () => {
  const { screen } = await renderClientTabs();

  await screen.getByRole('button', { name: 'Input Forms' }).click();

  await expect
    .element(screen.getByRole('button', { name: 'Input Forms' }))
    .toHaveClass('border-green-700');

  await expect
    .element(screen.getByRole('button', { name: 'Client Status' }))
    .toHaveClass('border-transparent');
});

test('switches back to Client Status from Input Forms', async () => {
  const { screen } = await renderClientTabs();

  await screen.getByRole('button', { name: 'Input Forms' }).click();
  await expect.element(screen.getByTestId('input-forms-panel')).toBeVisible();

  await screen.getByRole('button', { name: 'Client Status' }).click();

  await expect.element(screen.getByTestId('client-status-panel')).toBeVisible();
  await expect.element(screen.getByTestId('input-forms-panel')).not.toBeInTheDocument();
});

test('clicking the active tab keeps it selected', async () => {
  const { screen } = await renderClientTabs();

  await screen.getByRole('button', { name: 'Client Status' }).click();

  await expect.element(screen.getByTestId('client-status-panel')).toBeVisible();
  await expect.element(screen.getByTestId('input-forms-panel')).not.toBeInTheDocument();
});
