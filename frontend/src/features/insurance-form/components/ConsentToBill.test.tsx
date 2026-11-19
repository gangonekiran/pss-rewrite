import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import {
  DEFAULT_INSURANCE_FORM_VALUES,
  type InsuranceFormOptions,
  type InsuranceFormValues,
} from '../../../types/insurance-form';
import ConsentToBill from './ConsentToBill';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

type Errors = Partial<Record<Path<InsuranceFormValues>, string>>;
type Screen = Awaited<ReturnType<typeof render>>;

const options: InsuranceFormOptions = {
  billingConsent: [
    { code: 1, label: 'My private insurance for services provided to my child.' },
    { code: 2, label: 'For services billed to Medicaid, I understand.' },
    { code: 3, label: 'I decline permission to bill my private insurance.' },
  ],
  declineReasons: [
    { field: 'DeclineReasonCap', label: 'My available life-time cap would be affected' },
    { field: 'DeclineReasonBenefits', label: 'My other health insurance benefits would decrease' },
    { field: 'DeclineReasonPremium', label: 'My health insurance premiums would increase' },
    {
      field: 'DeclineReasonEligibility',
      label: 'I risk loss of eligibility for me/my child for home and community waivers',
    },
  ],
};

const PRIVATE = /My private insurance/;
const MEDICAID = /billed to Medicaid/;
const DECLINE = /I decline permission/;
const SIGNATURE = 'Parent or Guardian Signature Date';

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
      <ConsentToBill options={options} dob={dob} />
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

/* Radios are clicked through the DOM; coordinate clicks miss them in the scaled runner. */
async function check(radio: ReturnType<Screen['getByRole']>) {
  (radio.element() as HTMLInputElement).click();
  await expect.element(radio).toBeChecked();
}

const signatureInputs = (screen: Screen) => screen.getByLabelText(field(SIGNATURE)).elements();

test('shows the heading and the three consent choices in order', async () => {
  const { screen } = await renderInForm();

  await expect
    .element(screen.getByRole('heading', { name: 'Consent to Bill Insurance' }))
    .toBeVisible();

  const radios = screen.getByRole('radio');
  await expect.element(radios.first()).toBeVisible();
  expect(
    radios.elements().map((r) => [(r as HTMLInputElement).value, r.closest('label')?.textContent]),
  ).toEqual([
    ['1', options.billingConsent[0].label],
    ['2', options.billingConsent[1].label],
    ['3', options.billingConsent[2].label],
  ]);
});

test('the consent question is required', async () => {
  const { screen } = await renderInForm();

  const question = screen.getByText(/I give permission for Children's Integrated Services/);
  await expect.element(question).toBeVisible();
  expect(question.element().parentElement?.textContent).toContain('*');
});

test('shows no signature date and no Decline section until a consent is chosen', async () => {
  const { screen } = await renderInForm();

  await expect.element(screen.getByRole('radio', { name: PRIVATE })).not.toBeChecked();
  expect(signatureInputs(screen)).toHaveLength(0);
  expect(screen.getByText('Decline', { exact: true }).elements()).toHaveLength(0);
});

test.each([
  ['private insurance', PRIVATE],
  ['Medicaid', MEDICAID],
])('billing %s shows one required signature date and no decline reasons', async (_, name) => {
  const { screen } = await renderInForm();

  await check(screen.getByRole('radio', { name }));

  await expect.element(screen.getByLabelText(field(SIGNATURE))).toBeVisible();
  expect(signatureInputs(screen)).toHaveLength(1);
  expect(screen.getByText('Decline', { exact: true }).elements()).toHaveLength(0);
  expect(screen.getByText(/I choose to deny permission/).elements()).toHaveLength(0);
});

test('declining shows the Decline section with the four reasons and its signature date', async () => {
  const { screen } = await renderInForm();

  await check(screen.getByRole('radio', { name: DECLINE }));

  await expect.element(screen.getByText('Decline', { exact: true })).toBeVisible();
  await expect
    .element(screen.getByText(/I choose to deny permission for my private insurance/))
    .toBeVisible();
  for (const reason of options.declineReasons) {
    await expect.element(screen.getByRole('radio', { name: reason.label })).toBeVisible();
  }
  expect(signatureInputs(screen)).toHaveLength(1);
});

test('switching from decline to private billing hides the Decline section', async () => {
  const { screen } = await renderInForm({}, { values: { BillingConsent: '3' } });

  await expect.element(screen.getByText('Decline', { exact: true })).toBeVisible();

  await check(screen.getByRole('radio', { name: PRIVATE }));

  await expect.element(screen.getByLabelText(field(SIGNATURE))).toBeVisible();
  expect(screen.getByText('Decline', { exact: true }).elements()).toHaveLength(0);
});

test('signature dates start at the date of birth', async () => {
  const { screen } = await renderInForm({}, { values: { BillingConsent: '1' } });
  await expect
    .element(screen.getByLabelText(field(SIGNATURE)))
    .toHaveAttribute('min', '2024-03-10');

  await check(screen.getByRole('radio', { name: DECLINE }));
  await expect
    .element(screen.getByLabelText(field(SIGNATURE)))
    .toHaveAttribute('min', '2024-03-10');
});

test('signature dates have no lower limit without a date of birth', async () => {
  const { screen } = await renderInForm({ dob: null }, { values: { BillingConsent: '3' } });

  await expect.element(screen.getByLabelText(field(SIGNATURE))).not.toHaveAttribute('min');
});

test('shows a saved private-billing answer', async () => {
  const { screen } = await renderInForm(
    {},
    { values: { BillingConsent: '1', ParentSignatureDate: '2026-01-15' } },
  );

  await expect.element(screen.getByRole('radio', { name: PRIVATE })).toBeChecked();
  await expect.element(screen.getByLabelText(field(SIGNATURE))).toHaveValue('2026-01-15');
});

test('shows a saved decline with its reason and signature date', async () => {
  const { screen } = await renderInForm(
    {},
    {
      values: {
        BillingConsent: '3',
        declineReason: 'DeclineReasonPremium',
        ParentSignatureDate2: '2026-01-16',
      },
    },
  );

  await expect.element(screen.getByRole('radio', { name: DECLINE })).toBeChecked();
  await expect
    .element(screen.getByRole('radio', { name: 'My health insurance premiums would increase' }))
    .toBeChecked();
  await expect.element(screen.getByLabelText(field(SIGNATURE))).toHaveValue('2026-01-16');
});

test('stores the consent and the billing signature date', async () => {
  const { screen, getValues } = await renderInForm();

  await check(screen.getByRole('radio', { name: MEDICAID }));
  await page.elementLocator(screen.getByLabelText(field(SIGNATURE)).element()).fill('2026-01-15');

  expect(getValues()).toMatchObject({ BillingConsent: '2', ParentSignatureDate: '2026-01-15' });
});

test('stores the decline reason and the decline signature date', async () => {
  const { screen, getValues } = await renderInForm();

  await check(screen.getByRole('radio', { name: DECLINE }));
  await check(
    screen.getByRole('radio', { name: 'My other health insurance benefits would decrease' }),
  );
  await page.elementLocator(screen.getByLabelText(field(SIGNATURE)).element()).fill('2026-01-16');

  expect(getValues()).toMatchObject({
    BillingConsent: '3',
    declineReason: 'DeclineReasonBenefits',
    ParentSignatureDate2: '2026-01-16',
  });
});

test('shows the consent and billing signature errors', async () => {
  const { screen } = await renderInForm(
    {},
    {
      values: { BillingConsent: '1' },
      errors: {
        BillingConsent: 'Choose whether we may bill insurance.',
        ParentSignatureDate: 'Parent or Guardian Signature Date is required.',
      },
    },
  );

  await expect.element(screen.getByText('Choose whether we may bill insurance.')).toBeVisible();
  await expect
    .element(screen.getByText('Parent or Guardian Signature Date is required.'))
    .toBeVisible();
});

test('shows the decline errors', async () => {
  const { screen } = await renderInForm(
    {},
    {
      values: { BillingConsent: '3' },
      errors: {
        declineReason: 'Choose a reason.',
        ParentSignatureDate2: 'Parent or Guardian Signature Date cannot be before Date of Birth.',
      },
    },
  );

  await expect.element(screen.getByText('Choose a reason.')).toBeVisible();
  await expect
    .element(screen.getByText('Parent or Guardian Signature Date cannot be before Date of Birth.'))
    .toBeVisible();
});
