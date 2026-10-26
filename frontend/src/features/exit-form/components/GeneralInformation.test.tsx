import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import { DEFAULT_EXIT_FORM_VALUES, type ExitFormValues } from '../../../types/exit-form';
import GeneralInformation from './GeneralInformation';

type Errors = Partial<Record<Path<ExitFormValues>, string>>;

function Harness({
  defaultValues,
  errors,
  onReady,
  children,
}: {
  defaultValues: ExitFormValues;
  errors?: Errors;
  onReady: (methods: UseFormReturn<ExitFormValues>) => void;
  children: ReactNode;
}) {
  const methods = useForm<ExitFormValues>({ defaultValues });

  useEffect(() => {
    onReady(methods);
    for (const [name, message] of Object.entries(errors ?? {})) {
      methods.setError(name as Path<ExitFormValues>, { type: 'manual', message });
    }
    // Run once: the errors are fixed for each test.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

/**
 * Renders an Exit Form section inside a react-hook-form provider, as
 * ExitFormPage does. `values` are merged into the empty form; `errors`
 * are set on the fields as if validation had failed.
 */
async function renderInForm(
  ui: ReactNode,
  { values = {}, errors }: { values?: Partial<ExitFormValues>; errors?: Errors } = {},
) {
  let methods: UseFormReturn<ExitFormValues> | undefined;

  const screen = await render(
    <Harness
      defaultValues={{ ...DEFAULT_EXIT_FORM_VALUES, ...values }}
      errors={errors}
      onReady={(m) => {
        methods = m;
      }}
    >
      {ui}
    </Harness>,
  );

  return {
    screen,
    /** Current form values. */
    getValues: () => {
      if (!methods) throw new Error('Form is not ready');
      return methods.getValues();
    },
  };
}

const regions = [
  { ID: 1, RName: 'Burlington' },
  { ID: 2, RName: 'St Albans' },
];

test('shows only Region, Date of Referral and Date of Exit', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  await expect.element(screen.getByRole('heading', { name: 'General Information' })).toBeVisible();
  await expect.element(screen.getByLabelText('Region', { exact: true })).toBeVisible();
  await expect.element(screen.getByLabelText('Date of Referral', { exact: true })).toBeVisible();
  await expect.element(screen.getByLabelText('Date of Exit', { exact: true })).toBeVisible();

  expect(screen.container.querySelectorAll('input, select, textarea')).toHaveLength(3);
});

test('marks all three fields as required', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  await expect.element(screen.getByLabelText('Region', { exact: true })).toBeVisible();
  expect(screen.getByText('*').elements()).toHaveLength(3);
});

test('lists the regions after a "Select region" option', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  const options = [
    ...screen.getByLabelText('Region', { exact: true }).element().querySelectorAll('option'),
  ];
  expect(options.map((o) => [o.value, o.textContent])).toEqual([
    ['0', 'Select region'],
    ['1', 'Burlington'],
    ['2', 'St Albans'],
  ]);
});

test('shows only the placeholder when there are no regions', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={[]} />);

  const options = screen
    .getByLabelText('Region', { exact: true })
    .element()
    .querySelectorAll('option');
  expect(options).toHaveLength(1);
});

test('shows the current values', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />, {
    values: { Region: 2, ReferralDate: '2025-02-15', ExitDate: '2025-06-01' },
  });

  await expect.element(screen.getByLabelText('Region', { exact: true })).toHaveValue('2');
  await expect
    .element(screen.getByLabelText('Date of Referral', { exact: true }))
    .toHaveValue('2025-02-15');
  await expect
    .element(screen.getByLabelText('Date of Exit', { exact: true }))
    .toHaveValue('2025-06-01');
});

test('stores the region as a number', async () => {
  const { screen, getValues } = await renderInForm(<GeneralInformation regions={regions} />);

  await screen.getByLabelText('Region', { exact: true }).selectOptions('1');

  expect(getValues().Region).toBe(1);
});

test('stores the dates typed in', async () => {
  const { screen, getValues } = await renderInForm(<GeneralInformation regions={regions} />);

  await page
    .elementLocator(screen.getByLabelText('Date of Referral', { exact: true }).element())
    .fill('2025-02-15');
  await page
    .elementLocator(screen.getByLabelText('Date of Exit', { exact: true }).element())
    .fill('2025-06-01');

  expect(getValues()).toMatchObject({ ReferralDate: '2025-02-15', ExitDate: '2025-06-01' });
});

test('shows the field errors', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />, {
    errors: {
      Region: 'Region is required.',
      ReferralDate: 'Date of Referral is required.',
      ExitDate: 'Date of Exit cannot be before Date of Referral.',
    },
  });

  await expect.element(screen.getByText('Region is required.')).toBeVisible();
  await expect.element(screen.getByText('Date of Referral is required.')).toBeVisible();
  await expect
    .element(screen.getByText('Date of Exit cannot be before Date of Referral.'))
    .toBeVisible();
});
