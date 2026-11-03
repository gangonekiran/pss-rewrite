import { useFormContext } from 'react-hook-form';
import type { ActiveFormValues } from '../../../types/active-form';
import { beforeEach, expect, vi } from 'vitest';
import { test } from '../../../../test-extend';
import { render } from 'vitest-browser-react';
import GeneralInformation from './GeneralInformation';
import type { RegionLookup } from '../../../types';

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
}));

const mockUseFormContext = vi.mocked(useFormContext<ActiveFormValues>);

let registerMock = vi.fn();

function setupFormContext(
  regionMessage?: string,
  referralMessage?: string,
  statusMessage?: string,
) {
  const errors = {
    Region: {
      message: regionMessage,
    },
    ReferralDate: {
      message: referralMessage,
    },
    status: {
      message: statusMessage,
    },
  };

  registerMock = vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  }));

  mockUseFormContext.mockReturnValue({
    register: registerMock,
    formState: {
      errors: { ...errors },
    },
  } as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);
}

beforeEach(() => {
  setupFormContext();
});

const regionMessage = 'ABC region error message';
const referralMessage = 'Referral error message';
const statusMessage = 'Status error message';

const regions: RegionLookup[] = [
  { ID: 1, RName: 'Region 1' },
  { ID: 2, RName: 'Region 2' },
];

test('renders general information with everything present', async () => {
  setupFormContext(regionMessage, referralMessage, statusMessage);

  const screen = await render(<GeneralInformation regions={regions} />);

  expect(screen.getByText('General Information')).toBeVisible();
  expect(screen.getByText(regionMessage)).toBeVisible();
  expect(screen.getByRole('option', { name: 'Region 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Region 2' })).toBeInTheDocument();
  expect(screen.getByText(referralMessage)).toBeVisible();
  expect(screen.getByText(statusMessage)).toBeVisible();
  expect(screen.getByRole('option', { name: 'Select status' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Active One Plan' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Active One Plan - CAPTA' })).toBeInTheDocument();
});

test('renders general information with no field errors', async () => {
  const screen = await render(<GeneralInformation regions={regions} />);

  expect(screen.getByText('General Information')).toBeVisible();
  expect(screen.getByText(regionMessage)).not.toBeInTheDocument();
  expect(screen.getByText(referralMessage)).not.toBeInTheDocument();
  expect(screen.getByText(statusMessage)).not.toBeInTheDocument();
});

test('registers Region, Date of Referral and Status with the expected required messages', async () => {
  await render(<GeneralInformation regions={regions} />);

  expect(registerMock).toHaveBeenCalledWith(
    'Region',
    expect.objectContaining({
      valueAsNumber: true,
      required: 'Region is required',
    }),
  );
  expect(registerMock).toHaveBeenCalledWith(
    'ReferralDate',
    expect.objectContaining({ required: 'Date of Referral is required' }),
  );
  expect(registerMock).toHaveBeenCalledWith(
    'status',
    expect.objectContaining({ required: 'Status is required' }),
  );
});

test('Region validate rejects a non-positive region value and returns true for valid region', async () => {
  await render(<GeneralInformation regions={regions} />);

  const [, options] = registerMock.mock.calls.find(([name]) => name === 'Region')!;

  expect(options.validate(0)).toBe('Region is required');
  expect(options.validate(1)).toBe(true);
});
