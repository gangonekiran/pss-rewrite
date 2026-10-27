import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import {
  DEFAULT_EXIT_FORM_VALUES,
  type ExitFormOptions,
  type ExitFormValues,
} from '../../../types/exit-form';
import ExitDetails from './ExitDetails';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

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

const options: ExitFormOptions = {
  exitPriorToAge3: [
    { code: 7, label: 'Non-EI Client Exit' },
    { code: 8, label: 'Referral to CIS-EI' },
    { code: 1, label: 'Development at appropriate level' },
    { code: 2, label: 'Moved to other region' },
    { code: 3, label: 'Moved out of state' },
  ],
  exitAtAge3: [
    { code: 1, label: 'Child is potentially eligible for Part B services' },
    { code: 4, label: 'Child is NOT eligible for Part B' },
  ],
  referredTo: [
    { code: 1, label: 'Head Start' },
    { code: 5, label: 'Other' },
    { code: 99, label: 'Exited with no referral' },
  ],
};

const PRIOR_TITLE = 'Child Exited this region PRIOR TO AGE 3 OR NON-EI Client: Please check one';
const AT_AGE_3_TITLE = 'Child Exited AT AGE 3';

type Screen = Awaited<ReturnType<typeof renderInForm>>['screen'];

/* Radios are clicked through the DOM; coordinate clicks miss them in the scaled runner. */
async function check(screen: Screen, name: string) {
  const radio = screen.getByRole('radio', { name, exact: true });
  (radio.element() as HTMLInputElement).click();
  await expect.element(radio).toBeChecked();
}

function heading(screen: Screen, name: string) {
  return screen.getByRole('heading', { name, exact: true });
}

test('without an exit path, asks only when the child exited', async () => {
  const { screen } = await renderInForm(<ExitDetails options={options} dob={null} />);

  await expect
    .element(screen.getByRole('group', { name: field('When did the child exit?') }))
    .toBeVisible();
  await expect.element(screen.getByRole('radio', { name: 'Prior to age 3' })).not.toBeChecked();
  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).not.toBeChecked();

  expect(heading(screen, PRIOR_TITLE).elements()).toHaveLength(0);
  expect(heading(screen, AT_AGE_3_TITLE).elements()).toHaveLength(0);
  expect(heading(screen, 'Referred to').elements()).toHaveLength(0);
});

test('new form: suggests "At age 3" when the exit is near the 3rd birthday', async () => {
  const { screen, getValues } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { ExitDate: '2026-04-01' },
  });

  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).toBeChecked();
  expect(getValues().exitPath).toBe('atAge3');
});

test('new form: suggests "Prior to age 3" for an earlier exit', async () => {
  const { screen } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { ExitDate: '2025-06-01' },
  });

  await expect.element(screen.getByRole('radio', { name: 'Prior to age 3' })).toBeChecked();
});

test('does not suggest a path without a DOB', async () => {
  const { screen, getValues } = await renderInForm(<ExitDetails options={options} dob={null} />, {
    values: { ExitDate: '2026-04-01' },
  });

  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).not.toBeChecked();
  expect(getValues().exitPath).toBe('');
});

test('edit form: keeps the saved path even if the date suggests the other one', async () => {
  const { screen } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { ExitDate: '2026-04-01', exitPath: 'prior' },
  });

  await expect.element(screen.getByRole('radio', { name: 'Prior to age 3' })).toBeChecked();
});

test('keeps a path picked by the user when the exit date changes', async () => {
  const { screen } = await renderInForm(
    <>
      <input type="date" aria-label="Date of Exit" />
      <ExitDetails options={options} dob={DOB} />
    </>,
    { values: { ExitDate: '2026-04-01' } },
  );

  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).toBeChecked();
  await check(screen, 'Prior to age 3');

  await expect.element(screen.getByRole('radio', { name: 'Prior to age 3' })).toBeChecked();
});

test('prior to age 3: lists the reasons in order, starting with Non-EI and Referral to CIS-EI', async () => {
  const { screen } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior' },
  });

  await expect.element(heading(screen, PRIOR_TITLE)).toBeVisible();

  const group = screen.getByRole('group', { name: field('Reason for Exit') });
  await expect.element(group).toBeVisible();
  const labels = [...group.element().querySelectorAll('label')].map((l) => l.textContent?.trim());
  expect(labels).toEqual([
    'Non-EI Client Exit',
    'Referral to CIS-EI',
    'Development at appropriate level',
    'Moved to other region',
    'Moved out of state',
  ]);

  expect(heading(screen, AT_AGE_3_TITLE).elements()).toHaveLength(0);
});

test('prior to age 3: stores the chosen reason code', async () => {
  const { screen, getValues } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior' },
  });

  await check(screen, 'Non-EI Client Exit');
  expect(getValues().ExitPriorToAge3).toBe('7');

  await check(screen, 'Referral to CIS-EI');
  expect(getValues().ExitPriorToAge3).toBe('8');
});

test('Region Moved To shows only for "Moved to other region" and stores the text', async () => {
  const { screen, getValues } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior' },
  });

  expect(screen.getByLabelText(field('Region Moved To')).elements()).toHaveLength(0);

  await check(screen, 'Moved to other region');
  const input = screen.getByLabelText(field('Region Moved To'));
  await expect.element(input).toBeVisible();
  await page.elementLocator(input.element()).fill('Rutland');
  expect(getValues().MovedOtherRegion).toBe('Rutland');

  await check(screen, 'Moved out of state');
  expect(screen.getByLabelText(field('Region Moved To')).elements()).toHaveLength(0);
});

test('at age 3: lists the outcomes', async () => {
  const { screen } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'atAge3' },
  });

  await expect.element(heading(screen, AT_AGE_3_TITLE)).toBeVisible();
  await expect
    .element(screen.getByRole('group', { name: field('Child Exited at Age 3') }))
    .toBeVisible();
  await expect
    .element(
      screen.getByRole('radio', { name: 'Child is potentially eligible for Part B services' }),
    )
    .toBeVisible();
  expect(heading(screen, PRIOR_TITLE).elements()).toHaveLength(0);
});

test('at age 3: "NOT eligible for Part B" does not ask why (section removed)', async () => {
  const { screen, getValues } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'atAge3' },
  });

  await check(screen, 'Child is NOT eligible for Part B');

  expect(getValues().ExitAtAge3).toBe('4');
  expect(screen.getByText('Why is the child not eligible for Part B?').elements()).toHaveLength(0);
  expect(screen.getByRole('checkbox').elements()).toHaveLength(0);
});

test('switching path shows the other area', async () => {
  const { screen } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior' },
  });

  await expect.element(heading(screen, PRIOR_TITLE)).toBeVisible();

  await check(screen, 'At age 3');

  await expect.element(heading(screen, AT_AGE_3_TITLE)).toBeVisible();
  expect(heading(screen, PRIOR_TITLE).elements()).toHaveLength(0);
});

test('Referred to: shows the options, including Other and Exited with no referral', async () => {
  const { screen, getValues } = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior' },
  });

  await expect.element(heading(screen, 'Referred to')).toBeVisible();
  await expect.element(screen.getByRole('group', { name: field('Referred To') })).toBeVisible();
  await expect
    .element(screen.getByRole('radio', { name: 'Exited with no referral' }))
    .toBeVisible();
  expect(
    screen.getByText('Not eligible for Part B - exited with no referral').elements(),
  ).toHaveLength(0);

  await check(screen, 'Other');
  expect(getValues().ReferredTo).toBe('5');
});

test('Referred to is marked required only at age 3', async () => {
  const prior = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior' },
  });
  await expect.element(heading(prior.screen, 'Referred to')).toBeVisible();
  // "When did the child exit?" and "Reason for Exit" only.
  expect(prior.screen.getByText('*').elements()).toHaveLength(2);
  prior.screen.unmount();

  const atAge3 = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'atAge3' },
  });
  await expect.element(heading(atAge3.screen, 'Referred to')).toBeVisible();
  // "When did the child exit?", "Child Exited at Age 3" and "Referred To".
  expect(atAge3.screen.getByText('*').elements()).toHaveLength(3);
});

test('shows the field errors', async () => {
  const prior = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'prior', ExitPriorToAge3: '2' },
    errors: {
      exitPath: 'Choose when the child exited.',
      ExitPriorToAge3: 'Select the reason for exit.',
      MovedOtherRegion: 'Use 255 characters or fewer.',
      ReferredTo: 'Select where the child was referred.',
    },
  });

  await expect.element(prior.screen.getByText('Choose when the child exited.')).toBeVisible();
  await expect.element(prior.screen.getByText('Select the reason for exit.')).toBeVisible();
  await expect.element(prior.screen.getByText('Use 255 characters or fewer.')).toBeVisible();
  await expect
    .element(prior.screen.getByText('Select where the child was referred.'))
    .toBeVisible();
  prior.screen.unmount();

  const atAge3 = await renderInForm(<ExitDetails options={options} dob={DOB} />, {
    values: { exitPath: 'atAge3' },
    errors: { ExitAtAge3: 'Select an option.' },
  });

  await expect.element(atAge3.screen.getByText('Select an option.')).toBeVisible();
});
