import { render } from 'vitest-browser-react';
import { test } from '../../../../test-extend';

import { beforeEach, expect, vi, type Mock } from 'vitest';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ActiveFormValues } from '../../../types/active-form';
import Eligibility from './Eligibility';

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
  useWatch: vi.fn(),
}));

const mockUseFormContext = vi.mocked(useFormContext<ActiveFormValues>);
const mockUseWatch = useWatch as unknown as Mock;

let setValue = vi.fn();
let getValues = vi.fn();

/*
 * The component reads the current Other text via getValues('DCOtherDesc')
 * inside its effect, so each test configures what that returns.
 */
function setupFormContext(otherDesc: string | null | undefined) {
  setValue = vi.fn();
  getValues = vi.fn((name: string) => (name === 'DCOtherDesc' ? otherDesc : undefined));

  mockUseFormContext.mockReturnValue({
    register: vi.fn((name: string) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })),
    setValue,
    getValues,
  } as unknown as ReturnType<typeof useFormContext<ActiveFormValues>>);
}

beforeEach(() => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext('');
});

/* =========================================================
   RENDERING
========================================================= */

test('renders the section heading and helper text', async () => {
  const screen = await render(<Eligibility dob={null} />);

  await expect.element(screen.getByText('Eligibility')).toBeVisible();
  await expect.element(screen.getByText('Select all that apply.')).toBeVisible();
});

test('renders a checkbox for every eligibility selection plus NMNEI', async () => {
  const screen = await render(<Eligibility dob={null} />);

  const checkboxes = screen.container.querySelectorAll('input[type="checkbox"]');
  expect(checkboxes).toHaveLength(27);

  await expect
    .element(screen.getByRole('checkbox', { name: 'All developmental delays', exact: true }))
    .toBeVisible();
  await expect
    .element(
      screen.getByRole('checkbox', {
        name: 'Hypoxic-Ischemic Encephalopathy (HIE)',
        exact: true,
      }),
    )
    .toBeVisible();
  await expect
    .element(screen.getByRole('checkbox', { name: 'Feeding', exact: true }))
    .toBeVisible();
  await expect.element(screen.getByRole('checkbox', { name: 'NMNEI', exact: true })).toBeVisible();
});

test('renders the diagnosis date fields with labels, min date not set', async () => {
  const screen = await render(<Eligibility dob={null} />);

  await expect.element(screen.getByText('ASD Diagnosis Date')).toBeVisible();
  await expect.element(screen.getByText('Suspected ASD Diagnosis Date')).toBeVisible();
  await expect.element(screen.getByText('Vision Diagnosis Date')).toBeVisible();
  await expect.element(screen.getByText('Hearing Diagnosis Date')).toBeVisible();

  const dateInputs = screen.container.querySelectorAll('input[type="date"]');
  expect(dateInputs).toHaveLength(4);
  dateInputs.forEach((input) => {
    expect(input).not.toHaveAttribute('min');
  });
});

test('sets the min date on diagnosis dates from dob', async () => {
  const screen = await render(<Eligibility dob="2020-01-01" />);

  const dateInputs = screen.container.querySelectorAll('input[type="date"]');

  dateInputs.forEach((input) => {
    expect(input).toHaveAttribute('min', '2020-01-01');
  });
});

test('renders the Other field with a textarea and helper text', async () => {
  const screen = await render(<Eligibility dob={null} />);

  await expect.element(screen.getByRole('textbox', { name: 'Other' })).toBeInTheDocument();
  await expect
    .element(screen.getByPlaceholder('Enter specific diagnosis or other details...'))
    .toBeVisible();
  await expect.element(screen.getByText('No character limit.')).toBeVisible();
});

/* =========================================================
   NMNEI <-> Other field sync

   Eligibility keeps a literal "NMNEI" line in the Other textarea in
   sync with the NMNEI checkbox via a useEffect driven by useWatch.
========================================================= */

test('adds NMNEI to an empty Other field when NMNEI is selected', async () => {
  mockUseWatch.mockReturnValue(true);
  setupFormContext('');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(setValue).toHaveBeenCalledWith('DCOtherDesc', 'NMNEI');
  });
});

test('appends NMNEI to existing Other text when NMNEI is selected', async () => {
  mockUseWatch.mockReturnValue(true);
  setupFormContext('Existing note');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(setValue).toHaveBeenCalledWith('DCOtherDesc', 'Existing note\nNMNEI');
  });
});

test('does not duplicate NMNEI when it is already present in the Other field', async () => {
  mockUseWatch.mockReturnValue(true);
  setupFormContext('NMNEI');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(getValues).toHaveBeenCalledWith('DCOtherDesc');
  });

  expect(setValue).not.toHaveBeenCalled();
});

test('treats an existing NMNEI line as present regardless of case', async () => {
  mockUseWatch.mockReturnValue(true);
  setupFormContext('nmnei');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(getValues).toHaveBeenCalledWith('DCOtherDesc');
  });

  expect(setValue).not.toHaveBeenCalled();
});

test('removes NMNEI from the Other field when NMNEI is deselected', async () => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext('NMNEI');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(setValue).toHaveBeenCalledWith('DCOtherDesc', '');
  });
});

test('removes only the NMNEI line, preserving the rest of the Other field', async () => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext('First note\nNMNEI\nSecond note');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(setValue).toHaveBeenCalledWith('DCOtherDesc', 'First note\nSecond note');
  });
});

test('does not change the Other field when NMNEI is deselected and was never present', async () => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext('Some other detail');

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(getValues).toHaveBeenCalledWith('DCOtherDesc');
  });

  expect(setValue).not.toHaveBeenCalled();
});

test('does not throw when the Other field is null and NMNEI is unselected', async () => {
  mockUseWatch.mockReturnValue(false);
  setupFormContext(null);

  await render(<Eligibility dob={null} />);

  await vi.waitFor(() => {
    expect(getValues).toHaveBeenCalledWith('DCOtherDesc');
  });

  expect(setValue).not.toHaveBeenCalled();
});