import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import {
  DEFAULT_NOPR_FORM_VALUES,
  type NoprFormOptions,
  type NoprFormValues,
} from '../../../types/nopr-form';
import NoprStatus from './NoprStatus';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

type Errors = Partial<Record<Path<NoprFormValues>, string>>;
type Screen = Awaited<ReturnType<typeof render>>;

const options: NoprFormOptions = {
  refStatus: [
    { code: 8, label: 'Initial Contact Not Made' },
    { code: 1, label: 'Initial visit made - Screening/evaluation declined' },
    { code: 4, label: 'Evaluated - Not Eligible' },
    { code: 6, label: 'Moved or Lost Contact' },
  ],
  retiredRefStatus: [{ code: 7, label: 'Turned 3 during evaluation process' }],
};

const DOB = '2024-03-10T00:00:00.000Z';
const REFERRAL = '2026-01-05';
const STATUS = 'Date above status was determined';
const EVAL = 'Date of Initial Evaluation';
const RETIRED = 'Turned 3 during evaluation process (no longer used)';

interface Props {
  dob?: string | null;
  referral?: string | null;
  saved?: number | null;
}

function Harness({
  defaultValues,
  errors,
  onReady,
  children,
}: {
  defaultValues: NoprFormValues;
  errors?: Errors;
  onReady: (methods: UseFormReturn<NoprFormValues>) => void;
  children: ReactNode;
}) {
  const methods = useForm<NoprFormValues>({ defaultValues });

  useEffect(() => {
    onReady(methods);
    for (const [name, message] of Object.entries(errors ?? {})) {
      methods.setError(name as Path<NoprFormValues>, { type: 'manual', message });
    }
    // Run once: the errors are fixed for each test.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

/**
 * Renders the section inside a react-hook-form provider, as NoprFormPage does.
 * `values` are merged into the empty form; `errors` are set as if validation had failed.
 */
async function renderInForm(
  { dob = DOB, referral = REFERRAL, saved = null }: Props = {},
  { values = {}, errors }: { values?: Partial<NoprFormValues>; errors?: Errors } = {},
) {
  let methods: UseFormReturn<NoprFormValues> | undefined;

  const screen = await render(
    <Harness
      defaultValues={{ ...DEFAULT_NOPR_FORM_VALUES, ...values }}
      errors={errors}
      onReady={(m) => {
        methods = m;
      }}
    >
      <NoprStatus
        options={options}
        dob={dob}
        mostRecentReferralDate={referral}
        savedRefStatus={saved}
      />
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

async function fill(screen: Screen, label: string, value: string) {
  await page.elementLocator(screen.getByLabelText(field(label)).element()).fill(value);
}

const reasonLabels = (screen: Screen) =>
  screen
    .getByRole('radio')
    .elements()
    .map((r) => r.closest('label')?.textContent);

test('shows the heading, the description and the FITP note', async () => {
  const { screen } = await renderInForm();

  await expect
    .element(
      screen.getByRole('heading', {
        name: 'Status: Referred with No One Plan Resulting for Early Intervention Services',
      }),
    )
    .toBeVisible();
  await expect
    .element(screen.getByText('Select the one reason why a plan was not created.'))
    .toBeVisible();
  await expect
    .element(
      screen.getByText(
        /used by HP Enterprises \(FITP\) to turn off the Early Intervention voucher/,
      ),
    )
    .toBeVisible();
});

test('lists the reasons in the order given, without the retired reason', async () => {
  const { screen } = await renderInForm();

  await expect.element(screen.getByRole('radio').first()).toBeVisible();
  expect(reasonLabels(screen)).toEqual(options.refStatus.map((o) => o.label));
  expect(
    screen
      .getByRole('radio')
      .elements()
      .map((r) => (r as HTMLInputElement).value),
  ).toEqual(['8', '1', '4', '6']);
});

test('the reason is required', async () => {
  const { screen } = await renderInForm();

  const label = screen.getByText(field('Reason'));
  await expect.element(label).toBeVisible();
  expect(label.element().textContent).toContain('*');
});

test('shows the retired reason, marked as no longer used, on a form that has it', async () => {
  const { screen } = await renderInForm({ saved: 7 }, { values: { RefStatus: '7' } });

  await expect.element(screen.getByRole('radio', { name: RETIRED })).toBeChecked();
  expect(reasonLabels(screen)).toHaveLength(5);
});

test('does not show the retired reason on a form saved with another reason', async () => {
  const { screen } = await renderInForm({ saved: 4 }, { values: { RefStatus: '4' } });

  await expect
    .element(screen.getByRole('radio', { name: 'Evaluated - Not Eligible' }))
    .toBeChecked();
  expect(screen.getByRole('radio', { name: RETIRED }).elements()).toHaveLength(0);
});

test('only Date above status was determined is required', async () => {
  const { screen } = await renderInForm();

  const status = screen.getByLabelText(field(STATUS)).element() as HTMLInputElement;
  const evaluation = screen.getByLabelText(field(EVAL)).element() as HTMLInputElement;
  expect(status.labels?.[0]?.textContent).toContain('*');
  expect(evaluation.labels?.[0]?.textContent).not.toContain('*');
  expect(status.type).toBe('date');
  expect(evaluation.type).toBe('date');
});

test('the status date starts at the most recent referral date', async () => {
  const { screen } = await renderInForm();

  await expect.element(screen.getByLabelText(field(STATUS))).toHaveAttribute('min', REFERRAL);
  await expect
    .element(screen.getByText('Cannot be before the most recent referral date (01/05/2026).'))
    .toBeVisible();
});

test('without a referral the status date starts at the date of birth and shows no hint', async () => {
  const { screen } = await renderInForm({ referral: null });

  await expect.element(screen.getByLabelText(field(STATUS))).toHaveAttribute('min', '2024-03-10');
  expect(screen.getByText(/most recent referral date/).elements()).toHaveLength(0);
});

test('without a date of birth or a referral neither date has a lower limit', async () => {
  const { screen } = await renderInForm({ dob: null, referral: null });

  await expect.element(screen.getByLabelText(field(STATUS))).not.toHaveAttribute('min');
  await expect.element(screen.getByLabelText(field(EVAL))).not.toHaveAttribute('min');
});

test('the initial evaluation date runs from the date of birth to the status date', async () => {
  const { screen } = await renderInForm();

  await expect.element(screen.getByLabelText(field(EVAL))).toHaveAttribute('min', '2024-03-10');
  await expect.element(screen.getByLabelText(field(EVAL))).not.toHaveAttribute('max');

  await fill(screen, STATUS, '2026-02-02');
  await expect.element(screen.getByLabelText(field(EVAL))).toHaveAttribute('max', '2026-02-02');

  await fill(screen, STATUS, '2026-02-10');
  await expect.element(screen.getByLabelText(field(EVAL))).toHaveAttribute('max', '2026-02-10');
});

test('shows the optional hint under the initial evaluation date', async () => {
  const { screen } = await renderInForm();

  await expect
    .element(screen.getByText('Optional. Cannot be after the date the status was determined.'))
    .toBeVisible();
});

test('shows the current values', async () => {
  const { screen } = await renderInForm(
    {},
    { values: { RefStatus: '6', InitialEvalDate: '2026-01-20', StatusDate: '2026-02-02' } },
  );

  await expect.element(screen.getByRole('radio', { name: 'Moved or Lost Contact' })).toBeChecked();
  await expect.element(screen.getByLabelText(field(EVAL))).toHaveValue('2026-01-20');
  await expect.element(screen.getByLabelText(field(STATUS))).toHaveValue('2026-02-02');
});

test('stores the chosen reason and both dates', async () => {
  const { screen, getValues } = await renderInForm();

  await check(screen.getByRole('radio', { name: 'Initial Contact Not Made' }));
  await fill(screen, STATUS, '2026-02-02');
  await fill(screen, EVAL, '2026-01-20');

  expect(getValues()).toMatchObject({
    RefStatus: '8',
    StatusDate: '2026-02-02',
    InitialEvalDate: '2026-01-20',
  });
});

test('choosing another reason replaces the first', async () => {
  const { screen, getValues } = await renderInForm();

  await check(screen.getByRole('radio', { name: 'Evaluated - Not Eligible' }));
  await check(screen.getByRole('radio', { name: 'Moved or Lost Contact' }));

  await expect
    .element(screen.getByRole('radio', { name: 'Evaluated - Not Eligible' }))
    .not.toBeChecked();
  expect(getValues().RefStatus).toBe('6');
});

test('shows the field errors in place of the hints', async () => {
  const { screen } = await renderInForm(
    {},
    {
      errors: {
        RefStatus: 'Select the reason a plan was not created.',
        InitialEvalDate: 'Cannot be after the date the status was determined.',
        StatusDate: 'Cannot be before the most recent referral date (01/05/2026).',
      },
    },
  );

  await expect.element(screen.getByText('Select the reason a plan was not created.')).toBeVisible();
  await expect
    .element(screen.getByText('Cannot be after the date the status was determined.'))
    .toBeVisible();
  await expect
    .element(screen.getByText('Cannot be before the most recent referral date (01/05/2026).'))
    .toBeVisible();
  // The hints are hidden while the errors show (each message appears once).
  expect(screen.getByText(/Optional\. Cannot be after/).elements()).toHaveLength(0);
  expect(screen.getByText(/most recent referral date/).elements()).toHaveLength(1);
});
