import { render } from 'vitest-browser-react';
import { test } from '../../../../test-extend.ts';

import { Field } from './FormField.tsx';
import { expect } from 'vitest';

const label = 'Lalalabel';
const error = 'Oh no!';
const child = <input />;
const id = '123abc';

test('renders required field with everything present', async () => {
  const screen = await render(
    <Field id={id} label={label} required={true} error={error}>
      {child}
    </Field>,
  );

  expect(screen.getByText(label + '*')).toBeVisible();
  expect(screen.getByText(error)).toBeVisible();
});

test('renders non-required field with no errors', async () => {
  const screen = await render(
    <Field id={id} label={label} required={false}>
      {child}
    </Field>,
  );

  expect(screen.getByText(label)).toBeVisible();
  expect(screen.getByText('*')).not.toBeInTheDocument();
  expect(screen.getByText(error)).not.toBeInTheDocument();
});

test('renders non-required field alternate', async () => {
  const screen = await render(
    <Field id={id} label={label}>
      {child}
    </Field>,
  );

  expect(screen.getByText(label)).toBeVisible();
  expect(screen.getByText('*')).not.toBeInTheDocument();
  expect(screen.getByText(error)).not.toBeInTheDocument();
});