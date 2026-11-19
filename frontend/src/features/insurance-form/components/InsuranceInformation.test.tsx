import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import {
  DEFAULT_INSURANCE_FORM_VALUES,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import InsuranceInformation from './InsuranceInformation';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

type Errors = Partial<Record<Path<InsuranceFormValues>, string>>;
type Screen = Awaited<ReturnType<typeof render>>;

function Harness({
  defaultValues,
  errors,
  onReady,
  children,
}: {
  defaultValues: InsuranceFormValues;
  errors?: Errors;
  onReady: (methods: UseFormReturn<InsuranceFormValues>) => void;
  children: ReactNode;
}) {
  const methods = useForm<InsuranceFormValues>({ defaultValues });

  useEffect(() => {
    onReady(methods);
    for (const [name, message] of Object.entries(errors ?? {})) {
      methods.setError(name as Path<InsuranceFormValues>, { type: 'manual', message });
    }
    // Run once: the errors are fixed for each test.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

/**
 * Renders the section inside a react-hook-form provider, as InsuranceFormPage does.
 * `values` are merged into the empty form; `errors` are set as if validation had failed.
 */
async function renderInForm(
  { dob = '2024-03-10T00:00:00.000Z' }: { dob?: string | null } = {},
  { values = {}, errors }: { values?: Partial<InsuranceFormValues>; errors?: Errors } = {},
) {
  let methods: UseFormReturn<InsuranceFormValues> | undefined;

  const screen = await render(
    <Harness
      defaultValues={{ ...DEFAULT_INSURANCE_FORM_VALUES, ...values }}
      errors={errors}
      onReady={(m) => {
        methods = m;
      }}
    >
      <InsuranceInformation dob={dob} />
    </Harness>,
  );

  return {
    screen,
    getValues: () => {
      if (!methods) throw new Error('Form is not ready');
      return methods.getValues();
    },
  };
}

async function fill(screen: Screen, label: string, value: string) {
  await page.elementLocator(screen.getByLabelText(field(label)).element()).fill(value);
}

const TEXT_LABELS = [
  'Insurance Company Name',
  'Policy #',
  'Group # (Contract #)',
  'Group/Employer Name',
  'Individual Policy Holder',
];
const DATE_LABELS = ['Date Completed', 'Effective Date of Policy', 'End Date of Policy'];

test('shows the heading and the eight insurance fields', async () => {
  const { screen } = await renderInForm();

  await expect
    .element(screen.getByRole('heading', { name: 'Insurance Information' }))
    .toBeVisible();
  for (const label of [...DATE_LABELS, ...TEXT_LABELS]) {
    await expect.element(screen.getByLabelText(field(label))).toBeVisible();
  }
  expect(screen.container.querySelectorAll('input, select, textarea')).toHaveLength(8);
});

test('uses date pickers for the dates and text boxes for the rest', async () => {
  const { screen } = await renderInForm();

  for (const label of DATE_LABELS) {
    await expect.element(screen.getByLabelText(field(label))).toHaveAttribute('type', 'date');
  }
  for (const label of TEXT_LABELS) {
    await expect.element(screen.getByLabelText(field(label))).toHaveAttribute('type', 'text');
  }
});

test('only Date Completed is required when no consent is chosen', async () => {
  const { screen } = await renderInForm();

  await expect.element(screen.getByLabelText(field('Date Completed'))).toBeVisible();
  expect(screen.getByText('*', { exact: true }).elements()).toHaveLength(1);
});

test('Insurance Company Name is required for private insurance billing', async () => {
  const { screen } = await renderInForm({}, { values: { BillingConsent: '1' } });

  await expect.element(screen.getByLabelText(field('Insurance Company Name'))).toBeVisible();
  expect(screen.getByText('*', { exact: true }).elements()).toHaveLength(2);
  const input = screen
    .getByLabelText(field('Insurance Company Name'))
    .element() as HTMLInputElement;
  expect(input.labels?.[0]?.textContent).toContain('*');
});

test.each(['2', '3'] as const)(
  'Insurance Company Name is not required for consent %s',
  async (consent) => {
    const { screen } = await renderInForm({}, { values: { BillingConsent: consent } });

    await expect.element(screen.getByLabelText(field('Date Completed'))).toBeVisible();
    expect(screen.getByText('*', { exact: true }).elements()).toHaveLength(1);
  },
);

test('Date Completed starts at the date of birth', async () => {
  const { screen } = await renderInForm();

  await expect
    .element(screen.getByLabelText(field('Date Completed')))
    .toHaveAttribute('min', '2024-03-10');
});

test('Date Completed has no lower limit without a date of birth', async () => {
  const { screen } = await renderInForm({ dob: null });

  await expect.element(screen.getByLabelText(field('Date Completed'))).not.toHaveAttribute('min');
});

test('End Date of Policy has no lower limit until an Effective Date is entered', async () => {
  const { screen } = await renderInForm();

  await expect
    .element(screen.getByLabelText(field('End Date of Policy')))
    .not.toHaveAttribute('min');
  await expect
    .element(screen.getByLabelText(field('Effective Date of Policy')))
    .not.toHaveAttribute('min');
});

test('End Date of Policy starts at the Effective Date and follows it', async () => {
  const { screen } = await renderInForm({}, { values: { EffectiveDate: '2026-01-01' } });

  await expect
    .element(screen.getByLabelText(field('End Date of Policy')))
    .toHaveAttribute('min', '2026-01-01');

  await fill(screen, 'Effective Date of Policy', '2026-03-01');

  await expect
    .element(screen.getByLabelText(field('End Date of Policy')))
    .toHaveAttribute('min', '2026-03-01');
});

test('text fields allow at most 255 characters', async () => {
  const { screen } = await renderInForm();

  for (const label of TEXT_LABELS) {
    await expect.element(screen.getByLabelText(field(label))).toHaveAttribute('maxlength', '255');
  }
});

test('shows the current values', async () => {
  const { screen } = await renderInForm(
    {},
    {
      values: {
        FormDate: '2026-01-15',
        BranchAddress: 'Blue Cross',
        PolicyNumber: 'P-1',
        GroupNumber: 'G-1',
        GroupName: 'Acme',
        EffectiveDate: '2026-01-01',
        EndDate: '2026-12-31',
        PolicyHolder: 'Jane Austin',
      },
    },
  );

  await expect.element(screen.getByLabelText(field('Date Completed'))).toHaveValue('2026-01-15');
  await expect
    .element(screen.getByLabelText(field('Insurance Company Name')))
    .toHaveValue('Blue Cross');
  await expect.element(screen.getByLabelText(field('Policy #'))).toHaveValue('P-1');
  await expect.element(screen.getByLabelText(field('Group # (Contract #)'))).toHaveValue('G-1');
  await expect.element(screen.getByLabelText(field('Group/Employer Name'))).toHaveValue('Acme');
  await expect
    .element(screen.getByLabelText(field('Effective Date of Policy')))
    .toHaveValue('2026-01-01');
  await expect
    .element(screen.getByLabelText(field('End Date of Policy')))
    .toHaveValue('2026-12-31');
  await expect
    .element(screen.getByLabelText(field('Individual Policy Holder')))
    .toHaveValue('Jane Austin');
});

test('stores what is typed in each field', async () => {
  const { screen, getValues } = await renderInForm();

  await fill(screen, 'Date Completed', '2026-01-15');
  await fill(screen, 'Insurance Company Name', 'Blue Cross');
  await fill(screen, 'Policy #', 'P-1');
  await fill(screen, 'Group # (Contract #)', 'G-1');
  await fill(screen, 'Group/Employer Name', 'Acme');
  await fill(screen, 'Effective Date of Policy', '2026-01-01');
  await fill(screen, 'End Date of Policy', '2026-12-31');
  await fill(screen, 'Individual Policy Holder', 'Jane Austin');

  expect(getValues()).toMatchObject({
    FormDate: '2026-01-15',
    BranchAddress: 'Blue Cross',
    PolicyNumber: 'P-1',
    GroupNumber: 'G-1',
    GroupName: 'Acme',
    EffectiveDate: '2026-01-01',
    EndDate: '2026-12-31',
    PolicyHolder: 'Jane Austin',
  });
});

test('shows the field errors', async () => {
  const messages: Errors = {
    FormDate: 'Date Completed is required.',
    BranchAddress: 'Insurance Company Name is required for private insurance billing.',
    PolicyNumber: 'Use 255 characters or fewer.',
    EndDate: 'End Date of Policy cannot be before Effective Date of Policy.',
  };
  const { screen } = await renderInForm({}, { errors: messages });

  for (const message of Object.values(messages)) {
    await expect.element(screen.getByText(message!)).toBeVisible();
  }
});
