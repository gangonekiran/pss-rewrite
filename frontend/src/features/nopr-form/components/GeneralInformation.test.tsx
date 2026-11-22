import { expect } from 'vitest';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import { DEFAULT_NOPR_FORM_VALUES, type NoprFormValues } from '../../../types/nopr-form';
import GeneralInformation from './GeneralInformation';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

type Errors = Partial<Record<Path<NoprFormValues>, string>>;

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
  ui: ReactNode,
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
      {ui}
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

const regions = [
  { ID: 1, RName: 'Burlington' },
  { ID: 2, RName: 'St Albans' },
];

test('shows the heading and only the Region field', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  await expect.element(screen.getByRole('heading', { name: 'General Information' })).toBeVisible();
  await expect.element(screen.getByLabelText(field('Region'))).toBeVisible();
  expect(screen.container.querySelectorAll('input, select, textarea')).toHaveLength(1);
});

test('Region is required', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  const select = screen.getByLabelText(field('Region')).element() as HTMLSelectElement;
  expect(select.labels?.[0]?.textContent).toContain('*');
});

test('lists the regions after a "Select region" option', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  const options = [...screen.getByLabelText(field('Region')).element().querySelectorAll('option')];
  expect(options.map((o) => [o.value, o.textContent])).toEqual([
    ['0', 'Select region'],
    ['1', 'Burlington'],
    ['2', 'St Albans'],
  ]);
});

test('shows only the placeholder when there are no regions', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={[]} />);

  const options = screen.getByLabelText(field('Region')).element().querySelectorAll('option');
  expect(options).toHaveLength(1);
});

test('starts on "Select region" when no region is set', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />);

  await expect.element(screen.getByLabelText(field('Region'))).toHaveValue('0');
});

test('shows the current region', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />, {
    values: { Region: 2 },
  });

  await expect.element(screen.getByLabelText(field('Region'))).toHaveValue('2');
});

test('stores the chosen region as a number', async () => {
  const { screen, getValues } = await renderInForm(<GeneralInformation regions={regions} />);

  await screen.getByLabelText(field('Region')).selectOptions('1');

  expect(getValues().Region).toBe(1);
});

test('shows the Region error', async () => {
  const { screen } = await renderInForm(<GeneralInformation regions={regions} />, {
    errors: { Region: 'Region is required.' },
  });

  await expect.element(screen.getByText('Region is required.')).toBeVisible();
});
