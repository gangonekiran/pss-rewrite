import { render } from 'vitest-browser-react';
import { test } from '../../../../test-extend';

import type { ActiveFormValues, DelayReasonsResponse } from '../../../types/active-form';
import { expect, vi } from 'vitest';
import { useFormContext } from 'react-hook-form';
import DelayReasons from './DelayReasons';

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
}));

const mockUseFormContext = vi.mocked(useFormContext<ActiveFormValues>);

mockUseFormContext.mockReturnValue({
  register: vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  })),
  watch: vi.fn(() => ''),
} as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);

const reasons: DelayReasonsResponse = {
  family: [{ Reason: 'fam reason 1' }, { Reason: 'fam reason 2' }, { Reason: 'Other reasons' }],
  provider: [{ Reason: 'prov reason 1' }, { Reason: 'prov reason 2' }, { Reason: 'Other reasons' }],
};

test('renders Delay Reasons, initial prefix', async () => {
  const screen = await render(<DelayReasons reasons={reasons} prefix="initial" />);

  expect(screen.getByRole('option', { name: 'Select one reason (optional)' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'fam reason 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'fam reason 2' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Auto Eligible' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'prov reason 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'prov reason 2' })).toBeInTheDocument();

  const otherReasonOptions = screen.getByRole('option', { name: 'Other reasons' }).elements();

  expect(
    otherReasonOptions.some((option) => option.getAttribute('value') === 'family::Other reasons'),
  ).toBe(true);
  expect(
    otherReasonOptions.some((option) => option.getAttribute('value') === 'provider::Other reasons'),
  ).toBe(true);

  expect(screen.getByPlaceholder('Enter details...')).not.toBeInTheDocument();
  expect(screen.getByPlaceholder('Select Other reasons to enter details')).toBeInTheDocument();
});

test('renders Delay Reasons, onePlan prefix', async () => {
  const screen = await render(<DelayReasons reasons={reasons} prefix="onePlan" />);

  expect(screen.getByRole('option', { name: 'Select one reason (optional)' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'fam reason 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'fam reason 2' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Auto Eligible' })).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'prov reason 1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'prov reason 2' })).toBeInTheDocument();

  const otherReasonOptions = screen.getByRole('option', { name: 'Other reasons' }).elements();

  expect(
    otherReasonOptions.some((option) => option.getAttribute('value') === 'family::Other reasons'),
  ).toBe(true);
  expect(
    otherReasonOptions.some((option) => option.getAttribute('value') === 'provider::Other reasons'),
  ).toBe(true);

  expect(screen.getByPlaceholder('Enter details...')).not.toBeInTheDocument();
  expect(screen.getByPlaceholder('Select Other reasons to enter details')).toBeInTheDocument();
});

test('Selecting Family other option enables other field', async () => {
  mockUseFormContext.mockReturnValue({
    register: vi.fn((name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() })),
    watch: vi.fn(() => 'family::Other reasons'),
  } as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);

  const screen = await render(<DelayReasons reasons={reasons} prefix="initial" />);

  expect(screen.getByPlaceholder('Enter details...')).toBeInTheDocument();
  expect(screen.getByPlaceholder('Select Other reasons to enter details')).not.toBeInTheDocument();
});

test('Selecting Provider other option enables other field', async () => {
  mockUseFormContext.mockReturnValue({
    register: vi.fn((name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() })),
    watch: vi.fn(() => 'provider::Other reasons'),
  } as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);

  const screen = await render(<DelayReasons reasons={reasons} prefix="initial" />);

  expect(screen.getByPlaceholder('Enter details...')).toBeInTheDocument();
  expect(screen.getByPlaceholder('Select Other reasons to enter details')).not.toBeInTheDocument();
});