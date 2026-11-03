import { useFormContext, useWatch } from 'react-hook-form';
import { beforeEach, expect, vi, type Mock } from 'vitest';
import type { ActiveFormValues, DelayReasonsResponse } from '../../../types/active-form';
import { test } from '../../../../test-extend';
import { render } from 'vitest-browser-react';
import OnePlan from './OnePlan';

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
  useWatch: vi.fn(),
}));

const mockUseFormContext = vi.mocked(useFormContext<ActiveFormValues>);
const mockUseWatch = useWatch as unknown as Mock;

let registerMock = vi.fn();

function setupFormContext(onePlanDateError?: string) {
  const errors = onePlanDateError ? { onePlanDate: { message: onePlanDateError } } : {};

  registerMock = vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  }));

  mockUseFormContext.mockReturnValue({
    register: registerMock,
    watch: vi.fn(() => ''),
    formState: {
      errors: { ...errors },
    },
  } as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);
}

function setupWatch({ referralDate, onePlanDate }: { referralDate?: string; onePlanDate?: string }) {
  mockUseWatch.mockImplementation(({ name }: { name: string }) =>
    name === 'ReferralDate' ? referralDate : onePlanDate,
  );
}

beforeEach(() => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext();
});

const dateOfBirth = '2025-12-12';
const referralDate = '2026-01-01';
const onePlanDate = '2026-02-15';
const reasons: DelayReasonsResponse = {
  family: [{ Reason: 'fam reason 1' }, { Reason: 'fam reason 2' }, { Reason: 'Other reasons' }],
  provider: [{ Reason: 'prov reason 1' }, { Reason: 'prov reason 2' }, { Reason: 'Other reasons' }],
};

const daysLabel = 'Days Between Referral and One Plan (Read Only)';

test('renders one plan with everything present', async () => {
  setupWatch({ referralDate, onePlanDate });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByText('One Plan', { exact: true })).toBeVisible();
  expect(registerMock).toHaveBeenNthCalledWith(1, 'onePlanDate');
  expect(screen.getByRole('textbox', { name: daysLabel })).toHaveValue('45');
});

test('days field is read only', async () => {
  setupWatch({ referralDate, onePlanDate });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByRole('textbox', { name: daysLabel })).toHaveAttribute('readonly');
});

test('missing one plan date returns empty string for difference', async () => {
  setupWatch({ referralDate });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByRole('textbox', { name: daysLabel })).toHaveValue('');
});

test('missing referral date returns empty string for difference', async () => {
  setupWatch({ onePlanDate });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByRole('textbox', { name: daysLabel })).toHaveValue('');
});

test('shows a negative difference when the one plan date is before the referral date', async () => {
  setupWatch({ referralDate, onePlanDate: '2025-12-30' });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByRole('textbox', { name: daysLabel })).toHaveValue('-2');
});

test('shows the one plan date error message', async () => {
  setupFormContext('Date of One Plan cannot be before the referral date');
  setupWatch({ referralDate, onePlanDate });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByText('Date of One Plan cannot be before the referral date')).toBeVisible();
});

test('sets min to dob when dob is later than the referral date', async () => {
  setupWatch({ referralDate: '2025-01-01' });
  const screen = await render(<OnePlan reasons={reasons} dob="2025-06-01" />);

  const input = screen.getByRole('textbox', { name: 'Date of One Plan' });
  expect(input).toHaveAttribute('min', '2025-06-01');
});

test('sets min to referral date when the referral date is later than dob', async () => {
  setupWatch({ referralDate: '2025-06-01' });
  const screen = await render(<OnePlan reasons={reasons} dob="2025-01-01" />);

  const input = screen.getByRole('textbox', { name: 'Date of One Plan' });
  expect(input).toHaveAttribute('min', '2025-06-01');
});

test('sets min to referral date when dob is unknown', async () => {
  setupWatch({ referralDate: '2025-06-01' });
  const screen = await render(<OnePlan reasons={reasons} dob={null} />);

  const input = screen.getByRole('textbox', { name: 'Date of One Plan' });
  expect(input).toHaveAttribute('min', '2025-06-01');
});

test('sets min to dob when the referral date is unknown', async () => {
  setupWatch({});
  const screen = await render(<OnePlan reasons={reasons} dob="2025-01-01" />);

  const input = screen.getByRole('textbox', { name: 'Date of One Plan' });
  expect(input).toHaveAttribute('min', '2025-01-01');
});

test('omits min when neither referral date nor dob is known', async () => {
  setupWatch({});
  const screen = await render(<OnePlan reasons={reasons} dob={null} />);

  const input = screen.getByRole('textbox', { name: 'Date of One Plan' });
  expect(input).not.toHaveAttribute('min');
});

test('registers the one plan delay reason fields', async () => {
  setupWatch({ referralDate, onePlanDate });
  await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(registerMock).toHaveBeenCalledWith('MeetingDelayReason');
  expect(registerMock).toHaveBeenCalledWith('MeetingDelayDetails');
  expect(registerMock).not.toHaveBeenCalledWith('DelayReason');
});

test('does not offer Auto Eligible as a delay reason', async () => {
  setupWatch({ referralDate, onePlanDate });
  const screen = await render(<OnePlan reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByRole('option', { name: 'fam reason 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'prov reason 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Auto Eligible' }).query()).toBeNull();
});
