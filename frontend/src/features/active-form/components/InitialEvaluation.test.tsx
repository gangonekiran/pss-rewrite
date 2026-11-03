import { useFormContext, useWatch } from 'react-hook-form';
import { beforeEach, expect, vi, type Mock } from 'vitest';
import type { ActiveFormValues, DelayReasonsResponse } from '../../../types/active-form';
import { test } from '../../../../test-extend';
import { render } from 'vitest-browser-react';
import InitialEvaluation from './InitialEvaluation';

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
  useWatch: vi.fn(),
}));

const mockUseFormContext = vi.mocked(useFormContext<ActiveFormValues>);
const mockUseWatch = useWatch as unknown as Mock;

let registerMock = vi.fn();

function setupFormContext(initialEvalDate?: string) {
  const errors = {
    InitialEvalDate: {
      message: initialEvalDate,
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
    watch: vi.fn(() => ''),
    formState: {
      errors: { ...errors },
    },
  } as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);
}

function setupWatch({
  referralDate,
  evaluationDate,
}: {
  referralDate?: string;
  evaluationDate?: string;
}) {
  mockUseWatch.mockImplementation(({ name }: { name: string }) =>
    name === 'ReferralDate' ? referralDate : evaluationDate,
  );
}

beforeEach(() => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext();
});

const dateOfBirth = '2025-12-12';
const referralDate = '2026-01-01';
const initialEvalDate = '2026-01-02';
const reasons: DelayReasonsResponse = {
  family: [{ Reason: 'fam reason 1' }, { Reason: 'fam reason 2' }, { Reason: 'Other reasons' }],
  provider: [{ Reason: 'prov reason 1' }, { Reason: 'prov reason 2' }, { Reason: 'Other reasons' }],
};

test('renders initial evaluation with everything present', async () => {
  setupWatch({ referralDate: referralDate, evaluationDate: initialEvalDate });
  setupFormContext(initialEvalDate);
  const screen = await render(<InitialEvaluation reasons={reasons} dob={dateOfBirth} />);

  expect(screen.getByText('Initial Evaluation / Assessment')).toBeVisible();
  expect(registerMock).toHaveBeenNthCalledWith(1, 'InitialEvalDate');
  expect(
    screen.getByRole('textbox', {
      name: 'Days Between Referral and Initial Evaluation (Read Only)',
    }),
  ).toHaveValue('1');
});

test('missing evaluation date returns empty string for difference', async () => {
  setupWatch({ referralDate: referralDate });
  setupFormContext(initialEvalDate);
  const screen = await render(<InitialEvaluation reasons={reasons} dob={dateOfBirth} />);

  expect(
    screen.getByRole('textbox', {
      name: 'Days Between Referral and Initial Evaluation (Read Only)',
    }),
  ).toHaveValue('');
});

test('sets min to dob when dob is later than the referral date', async () => {
  setupWatch({ referralDate: '2025-01-01' });
  const screen = await render(<InitialEvaluation reasons={reasons} dob="2025-06-01" />);

  const input = screen.getByRole('textbox', { name: 'Date of Initial Evaluation / Assessment' });
  expect(input).toHaveAttribute('min', '2025-06-01');
});

test('sets min to referral date when the referral date is later than dob', async () => {
  setupWatch({ referralDate: '2025-06-01' });
  const screen = await render(<InitialEvaluation reasons={reasons} dob="2025-01-01" />);

  const input = screen.getByRole('textbox', { name: 'Date of Initial Evaluation / Assessment' });
  expect(input).toHaveAttribute('min', '2025-06-01');
});

test('omits min when neither referral date nor dob is known', async () => {
  setupWatch({});
  const screen = await render(<InitialEvaluation reasons={reasons} dob={null} />);

  const input = screen.getByRole('textbox', { name: 'Date of Initial Evaluation / Assessment' });
  expect(input).not.toHaveAttribute('min');
});