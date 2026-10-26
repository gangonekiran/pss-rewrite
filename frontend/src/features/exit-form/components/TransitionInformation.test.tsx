import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import { DEFAULT_EXIT_FORM_VALUES, type ExitFormValues } from '../../../types/exit-form';
import TransitionInformation from './TransitionInformation';

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

const DOB = '2023-04-10T00:00:00.000Z';

const filled = {
  ReferralDate: '2025-02-15',
  ExitDate: '2026-04-01',
  TransitionPlanCompleted: '2025-10-01',
  CLLEANotificationDate: '2025-11-01',
  TransitionMeeting: '2025-12-15',
};

type Screen = Awaited<ReturnType<typeof renderInForm>>['screen'];

const days = (screen: Screen, label: string) =>
  screen.getByLabelText(`${label} (Read Only)`, { exact: true });

async function fill(screen: Screen, label: string, value: string) {
  await page.elementLocator(screen.getByLabelText(label, { exact: true }).element()).fill(value);
}

test('shows the transition dates, the delay reason and the day counts', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />);

  await expect
    .element(screen.getByRole('heading', { name: 'Transition Information' }))
    .toBeVisible();
  for (const label of [
    'Date Written Transition Plan',
    'Transition Plan Delay Reason',
    'LEA Notification Date',
    'Date of Transition Conference',
  ]) {
    await expect.element(screen.getByLabelText(label, { exact: true })).toBeVisible();
  }
  for (const label of [
    'Days Between Referral and Transition Plan',
    'Days Between LEA Notification and Exit',
    'Days Between Transition Conference and Exit',
    'Days Between Exit and 3rd Birthday',
  ]) {
    await expect.element(days(screen, label)).toBeVisible();
  }
});

test('uses the new LEA label', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />);

  await expect
    .element(screen.getByLabelText('LEA Notification Date', { exact: true }))
    .toBeVisible();
  expect(screen.getByText("Date LEA Notified of Child's Name").elements()).toHaveLength(0);
});

test('the delay reason box prompts for family or provider circumstance', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />);

  const box = screen.getByLabelText('Transition Plan Delay Reason', { exact: true });
  await expect
    .element(box)
    .toHaveAttribute('placeholder', 'Family circumstance or provider circumstance, and details');
  expect(box.element().tagName).toBe('TEXTAREA');
});

test('stores the delay reason typed in', async () => {
  const { screen, getValues } = await renderInForm(<TransitionInformation dob={DOB} />);

  await fill(screen, 'Transition Plan Delay Reason', 'Family circumstance: parent ill');

  expect(getValues().TransitionPlanReason).toBe('Family circumstance: parent ill');
});

test('shows the 3rd birthday in the description', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />);

  await expect
    .element(screen.getByText('Required when the child exits at age 3. 3rd birthday: 04/10/2026.'))
    .toBeVisible();
});

test('leaves the 3rd birthday out without a DOB', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={null} />);

  await expect
    .element(screen.getByText('Required when the child exits at age 3.', { exact: true }))
    .toBeVisible();
});

test('calculates the day counts from the dates', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />, { values: filled });

  await expect
    .element(days(screen, 'Days Between Referral and Transition Plan'))
    .toHaveValue('228');
  await expect.element(days(screen, 'Days Between LEA Notification and Exit')).toHaveValue('151');
  await expect
    .element(days(screen, 'Days Between Transition Conference and Exit'))
    .toHaveValue('107');
  await expect.element(days(screen, 'Days Between Exit and 3rd Birthday')).toHaveValue('9');
});

test('updates the day counts as dates are typed', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />, {
    values: { ReferralDate: '2025-02-15', ExitDate: '2026-04-01' },
  });

  await expect.element(days(screen, 'Days Between Referral and Transition Plan')).toHaveValue('');

  await fill(screen, 'Date Written Transition Plan', '2025-03-01');
  await expect.element(days(screen, 'Days Between Referral and Transition Plan')).toHaveValue('14');

  await fill(screen, 'LEA Notification Date', '2026-01-01');
  await expect.element(days(screen, 'Days Between LEA Notification and Exit')).toHaveValue('90');
});

test('leaves the day counts blank when dates are missing', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={null} />);

  for (const label of [
    'Days Between Referral and Transition Plan',
    'Days Between LEA Notification and Exit',
    'Days Between Transition Conference and Exit',
    'Days Between Exit and 3rd Birthday',
  ]) {
    await expect.element(days(screen, label)).toHaveValue('');
  }
});

test('the day counts are read-only', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />, { values: filled });

  await expect
    .element(days(screen, 'Days Between Referral and Transition Plan'))
    .toHaveAttribute('readonly');
});

test('marks the three dates as required only for an exit at age 3', async () => {
  const prior = await renderInForm(<TransitionInformation dob={DOB} />, {
    values: { exitPath: 'prior' },
  });
  await expect
    .element(prior.screen.getByLabelText('LEA Notification Date', { exact: true }))
    .toBeVisible();
  expect(prior.screen.getByText('*').elements()).toHaveLength(0);
  prior.screen.unmount();

  const atAge3 = await renderInForm(<TransitionInformation dob={DOB} />, {
    values: { exitPath: 'atAge3' },
  });
  await expect
    .element(atAge3.screen.getByLabelText('LEA Notification Date', { exact: true }))
    .toBeVisible();
  expect(atAge3.screen.getByText('*').elements()).toHaveLength(3);
});

test('shows the field errors', async () => {
  const { screen } = await renderInForm(<TransitionInformation dob={DOB} />, {
    errors: {
      TransitionPlanCompleted: 'Date Written Transition Plan cannot be before Date of Referral.',
      CLLEANotificationDate: 'LEA Notification Date is required.',
      TransitionMeeting: 'Cannot be after Date of Exit.',
    },
  });

  await expect
    .element(screen.getByText('Date Written Transition Plan cannot be before Date of Referral.'))
    .toBeVisible();
  await expect.element(screen.getByText('LEA Notification Date is required.')).toBeVisible();
  await expect.element(screen.getByText('Cannot be after Date of Exit.')).toBeVisible();
});
