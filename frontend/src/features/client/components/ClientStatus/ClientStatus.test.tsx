import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import clientService from '../../../../services/client.service';
import type { Client } from '../../../../types/client';

import ClientStatus from './ClientStatus';

vi.mock('../../../../services/client.service', () => ({
  default: {
    getStatus: vi.fn(),
    getServiceHistory: vi.fn(),
  },
}));

vi.mock('../Notes', () => ({
  default: ({
    value,
    onChange,
    readOnly = false,
  }: {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
  }) => (
    <div>
      <label htmlFor="client-status-notes">Notes</label>
      <textarea
        id="client-status-notes"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  ),
}));

vi.mock('../ServiceHistory/ServiceHistory', () => ({
  default: ({ services }: { services: unknown[] }) => (
    <div data-testid="service-history">Service History: {services.length}</div>
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

const statusData = {
  notes: 'Client status notes',
  status: 'Active',
  referralDate: '2024-01-15',
  noOnePlanDate: '2024-02-20',
  interimDate: '2024-03-10',
  onePlanDate: '2024-04-25',
  exitDate: '2024-05-30',
};

const serviceHistory = [
  {
    id: 1,
    date: '2024-01-15',
    serviceName: 'Speech Therapy',
    frequency: 'Weekly',
    consent: 'Yes',
    casePlan: 'Case Plan 1',
  },
  {
    id: 2,
    date: '2024-02-20',
    serviceName: 'Occupational Therapy',
    frequency: 'Monthly',
    consent: 'Yes',
    casePlan: 'Case Plan 2',
  },
];

async function renderClientStatus(client = createClient()) {
  const screen = await render(<ClientStatus client={client} />);
  return { screen };
}

/*
 * Locator has no chained .locator() in this vitest version, so the date
 * input is read straight from the DOM.
 */
function getDateInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="date"]');

  if (!input) {
    throw new Error('Date input not found');
  }

  return input;
}

/*
 * React only reacts to input events that follow the native value setter.
 */
function setDateValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;

  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(clientService.getStatus).mockResolvedValue(statusData);
  vi.mocked(clientService.getServiceHistory).mockResolvedValue(serviceHistory);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders client status header and controls', async () => {
  const { screen } = await renderClientStatus();

  const header = screen.getByText('Client Status On');

  // Label next to the date input
  await expect.element(header.first()).toBeVisible();
  // Bold text in the summary paragraph
  await expect.element(header.nth(1)).toBeVisible();

  await expect.element(screen.getByRole('button', { name: 'Go' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Today' })).toBeVisible();
  await expect.element(screen.getByLabelText('Notes')).toBeVisible();
});

test('does not load data when no client is selected', async () => {
  const { screen } = await renderClientStatus(createClient({ childId: undefined }));

  await expect.element(screen.getByText('Select a client to view status.')).toBeVisible();

  expect(clientService.getStatus).not.toHaveBeenCalled();
  expect(clientService.getServiceHistory).not.toHaveBeenCalled();

  await expect.element(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
});

test('loads client status when a client is selected', async () => {
  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalledWith(123, expect.any(String));
  });

  await expect.element(screen.getByText('Active', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('1/15/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('2/20/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('3/10/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('4/25/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('5/30/2024', { exact: true })).toBeVisible();
});

test('loads service history when a client is selected', async () => {
  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getServiceHistory).toHaveBeenCalledWith(123);
  });

  await expect.element(screen.getByText('Service History: 2')).toBeVisible();
});

test('loads notes returned by the status API', async () => {
  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalled();
  });

  await expect.element(screen.getByLabelText('Notes')).toHaveValue('Client status notes');
});

test('loads status for a selected date when Go is clicked', async () => {
  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalledTimes(1);
  });

  const dateInput = getDateInput(screen.container);

  setDateValue(dateInput, '2024-06-15');

  await vi.waitFor(() => {
    expect(dateInput.value).toBe('2024-06-15');
  });

  await screen.getByRole('button', { name: 'Go' }).click();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenLastCalledWith(123, '2024-06-15');
  });
});

test('loads today when Today is clicked', async () => {
  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalledTimes(1);
  });

  const dateInput = getDateInput(screen.container);

  setDateValue(dateInput, '2024-06-15');

  await vi.waitFor(() => {
    expect(dateInput.value).toBe('2024-06-15');
  });

  await screen.getByRole('button', { name: 'Today' }).click();

  const expectedToday = formatLocalDate(new Date());

  await vi.waitFor(() => {
    expect(dateInput.value).toBe(expectedToday);
  });

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenLastCalledWith(123, expectedToday);
  });
});

test('updates notes when Notes is changed', async () => {
  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalled();
  });

  const notes = screen.getByLabelText('Notes');

  await notes.fill('Updated client notes');

  await expect.element(notes).toHaveValue('Updated client notes');
});

test('renders dash values when status data contains nulls', async () => {
  vi.mocked(clientService.getStatus).mockResolvedValue({
    notes: '',
    status: null,
    referralDate: null,
    noOnePlanDate: null,
    interimDate: null,
    onePlanDate: null,
    exitDate: null,
  });

  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalled();
  });

  // status + 5 dates
  const dashes = screen.getByText('—', { exact: true });

  await vi.waitFor(() => {
    expect(dashes.elements()).toHaveLength(6);
  });
});

test('handles client status loading failure', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(clientService.getStatus).mockRejectedValue(new Error('Status loading failed'));

  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalled();
  });

  await expect.element(screen.getByText('Unable to load client status.')).toBeVisible();

  await expect.element(screen.getByLabelText('Notes')).toHaveValue('');

  expect(consoleError).toHaveBeenCalled();
});

test('handles service history loading failure', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(clientService.getServiceHistory).mockRejectedValue(
    new Error('Service history loading failed'),
  );

  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getServiceHistory).toHaveBeenCalledWith(123);
  });

  await expect.element(screen.getByText('Service History: 0')).toBeVisible();

  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
  });
});

test('shows Loading while status is loading', async () => {
  // "!" avoids TypeScript narrowing this to `undefined` inside the closure below
  let resolveStatus!: (value: typeof statusData) => void;

  const pendingStatus = new Promise<typeof statusData>((resolve) => {
    resolveStatus = resolve;
  });

  vi.mocked(clientService.getStatus).mockReturnValue(pendingStatus);

  const { screen } = await renderClientStatus();

  await expect.element(screen.getByRole('button', { name: 'Loading...' })).toBeVisible();

  resolveStatus(statusData);

  await expect.element(screen.getByRole('button', { name: 'Go' })).toBeVisible();
});

test('displays Inactive status when returned by the API', async () => {
  vi.mocked(clientService.getStatus).mockResolvedValue({
    ...statusData,
    status: 'Inactive',
  });

  const { screen } = await renderClientStatus();

  await vi.waitFor(() => {
    expect(clientService.getStatus).toHaveBeenCalled();
  });

  await expect.element(screen.getByText('Inactive', { exact: true })).toBeVisible();
});
