import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import commonInfoService from '../../../services/common-info.service';
import type { Client } from '../../../types/client';

import ClientPage from './ClientPage';

const { clearLookupMock } = vi.hoisted(() => ({
  clearLookupMock: vi.fn(),
}));

vi.mock('../../../services/common-info.service', () => ({
  default: {
    regions: vi.fn(),
  },
}));

/*
 * ClientPage only wires its children together, so every child is mocked.
 * The mocks render the props they receive and expose buttons that call the
 * callbacks ClientPage passes down.
 */
vi.mock('../../../layouts/PageContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main data-testid="page-container">{children}</main>
  ),
}));

vi.mock('../components/ClientLookup/ClientLookup', async () => {
  const React = await import('react');

  const MockClientLookup = React.forwardRef(function MockClientLookup(
    {
      client,
      setClient,
      isLocked,
    }: {
      client: Client;
      setClient: (client: Client) => void;
      isLocked: boolean;
    },
    ref: React.ForwardedRef<{ clearLookup: () => void }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      clearLookup: clearLookupMock,
    }));

    return (
      <div data-testid="client-lookup">
        <p>Lookup locked: {String(isLocked)}</p>
        <p>Lookup first name: [{client.firstName}]</p>
        <p>Lookup last name: [{client.lastName}]</p>
        <button
          type="button"
          onClick={() =>
            setClient({
              ...client,
              childId: 500,
              firstName: 'Jane',
              lastName: 'Doe',
            })
          }
        >
          Mock load client
        </button>
      </div>
    );
  });

  return { default: MockClientLookup };
});

vi.mock('../components/ClientActions/ClientActions', () => ({
  default: ({
    client,
    setClient,
    isNewClient,
    setIsNewClient,
    clearClient,
    isLocked,
    setIsLocked,
    clearClientLookup,
  }: {
    client: Client;
    setClient: (client: Client) => void;
    isNewClient: boolean;
    setIsNewClient: (value: boolean) => void;
    clearClient: () => void;
    isLocked: boolean;
    setIsLocked: (value: boolean) => void;
    clearClientLookup: () => void;
  }) => (
    <div data-testid="client-actions">
      <p>Actions new client: {String(isNewClient)}</p>
      <p>Actions locked: {String(isLocked)}</p>
      <p>Actions client id: {String(client.childId)}</p>
      <button type="button" onClick={() => setIsLocked(false)}>
        Mock unlock
      </button>
      <button type="button" onClick={() => setIsLocked(true)}>
        Mock lock
      </button>
      <button type="button" onClick={() => setIsNewClient(false)}>
        Mock mark existing
      </button>
      <button type="button" onClick={() => setClient({ ...client, firstName: 'Edited' })}>
        Mock edit first name
      </button>
      <button type="button" onClick={clearClient}>
        Mock clear client
      </button>
      <button type="button" onClick={clearClientLookup}>
        Mock clear lookup
      </button>
    </div>
  ),
}));

vi.mock('../components/ClientTabs/ClientTabs', () => ({
  default: ({
    client,
    regions,
    onClientNotesChange,
  }: {
    client: Client;
    regions: unknown[];
    onClientNotesChange: (notes: string) => void;
  }) => (
    <div data-testid="client-tabs">
      <p>Tabs client id: {String(client.childId)}</p>
      <p>Tabs regions: {regions.length}</p>
      <p>Tabs notes: [{client.notes}]</p>
      <button type="button" onClick={() => onClientNotesChange('Updated notes')}>
        Mock change notes
      </button>
    </div>
  ),
}));

const regions = [
  { ID: 1, RName: 'Region 1' },
  { ID: 2, RName: 'Region 2' },
];

async function renderClientPage() {
  const screen = await render(<ClientPage />);

  return { screen };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(commonInfoService.regions).mockResolvedValue(regions);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* =========================================================
   LAYOUT
========================================================= */

test('renders lookup, actions and tabs inside the page container', async () => {
  const { screen } = await renderClientPage();

  const container = screen.getByTestId('page-container');

  await expect.element(container).toBeVisible();
  await expect.element(screen.getByTestId('client-lookup')).toBeVisible();
  await expect.element(screen.getByTestId('client-actions')).toBeVisible();
  await expect.element(screen.getByTestId('client-tabs')).toBeVisible();

  // The three sections are nested in the container
  expect(container.element().contains(screen.getByTestId('client-lookup').element())).toBe(true);
  expect(container.element().contains(screen.getByTestId('client-actions').element())).toBe(true);
  expect(container.element().contains(screen.getByTestId('client-tabs').element())).toBe(true);
});

/* =========================================================
   INITIAL STATE
========================================================= */

test('starts with an empty, locked new client', async () => {
  const { screen } = await renderClientPage();

  await expect.element(screen.getByText('Lookup first name: []', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Lookup last name: []', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions client id: undefined', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Tabs client id: undefined', { exact: true })).toBeVisible();

  await expect.element(screen.getByText('Actions new client: true', { exact: true })).toBeVisible();

  await expect.element(screen.getByText('Lookup locked: true', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions locked: true', { exact: true })).toBeVisible();
});

/* =========================================================
   REGIONS
========================================================= */

test('loads regions once on mount and passes them to the tabs', async () => {
  const { screen } = await renderClientPage();

  await vi.waitFor(() => {
    expect(commonInfoService.regions).toHaveBeenCalledTimes(1);
  });

  await expect.element(screen.getByText('Tabs regions: 2', { exact: true })).toBeVisible();
});

test('passes an empty region list to the tabs when regions fail to load', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(commonInfoService.regions).mockRejectedValue(new Error('Regions failed'));

  const { screen } = await renderClientPage();

  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
  });

  await expect.element(screen.getByText('Tabs regions: 0', { exact: true })).toBeVisible();
});

/* =========================================================
   SHARED CLIENT STATE
========================================================= */

test('a client selected in the lookup reaches the actions and tabs', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock load client', exact: true }).click();

  await expect.element(screen.getByText('Lookup first name: [Jane]', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Lookup last name: [Doe]', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions client id: 500', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Tabs client id: 500', { exact: true })).toBeVisible();
});

test('a client edited through the actions reaches the lookup', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock edit first name', exact: true }).click();

  await expect.element(screen.getByText('Lookup first name: [Edited]', { exact: true })).toBeVisible();
});

test('notes changed in the tabs update the client and keep its other fields', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock load client', exact: true }).click();
  await screen.getByRole('button', { name: 'Mock change notes', exact: true }).click();

  await expect.element(screen.getByText('Tabs notes: [Updated notes]', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Tabs client id: 500', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Lookup first name: [Jane]', { exact: true })).toBeVisible();
});

/* =========================================================
   LOCK STATE
========================================================= */

test('unlocking from the actions unlocks the lookup, and locking locks it again', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock unlock', exact: true }).click();

  await expect.element(screen.getByText('Lookup locked: false', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions locked: false', { exact: true })).toBeVisible();

  await screen.getByRole('button', { name: 'Mock lock', exact: true }).click();

  await expect.element(screen.getByText('Lookup locked: true', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions locked: true', { exact: true })).toBeVisible();
});

/* =========================================================
   NEW CLIENT FLAG
========================================================= */

test('setIsNewClient updates the flag passed to the actions', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock mark existing', exact: true }).click();

  await expect.element(screen.getByText('Actions new client: false', { exact: true })).toBeVisible();
});

/* =========================================================
   CLEARING
========================================================= */

test('clearClient resets the client and marks it as new', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock load client', exact: true }).click();
  await screen.getByRole('button', { name: 'Mock mark existing', exact: true }).click();

  await expect.element(screen.getByText('Actions client id: 500', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions new client: false', { exact: true })).toBeVisible();

  await screen.getByRole('button', { name: 'Mock clear client', exact: true }).click();

  await expect.element(screen.getByText('Actions client id: undefined', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Tabs client id: undefined', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Lookup first name: []', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Lookup last name: []', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Actions new client: true', { exact: true })).toBeVisible();
});

test('clearClient does not change the lock state', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock unlock', exact: true }).click();
  await screen.getByRole('button', { name: 'Mock clear client', exact: true }).click();

  await expect.element(screen.getByText('Actions locked: false', { exact: true })).toBeVisible();
});

test('clearClient does not clear the lookup by itself', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock clear client', exact: true }).click();

  expect(clearLookupMock).not.toHaveBeenCalled();
});

test('clearClientLookup calls clearLookup on the lookup ref', async () => {
  const { screen } = await renderClientPage();

  await screen.getByRole('button', { name: 'Mock clear lookup', exact: true }).click();

  expect(clearLookupMock).toHaveBeenCalledTimes(1);
});
