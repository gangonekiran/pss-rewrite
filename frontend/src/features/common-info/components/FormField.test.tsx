import { expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import { Field } from './FormField';

test('links the label to the control by id', async () => {
  const screen = await render(
    <Field id="exit-date" label="Date of Exit">
      <input id="exit-date" type="date" />
    </Field>,
  );

  const input = screen.getByLabelText('Date of Exit', { exact: true });
  await expect.element(input).toBeVisible();
  expect(input.element().id).toBe('exit-date');
});

test('keeps the * out of the label text and marks the control required', async () => {
  const screen = await render(
    <Field id="region" label="Region" required>
      <select id="region" />
    </Field>,
  );

  await expect
    .element(screen.getByLabelText('Region', { exact: true }))
    .toHaveAttribute('aria-required', 'true');
  await expect.element(screen.getByText('*')).toBeVisible();
  expect(screen.getByText('*').element().getAttribute('aria-hidden')).toBe('true');
});

test('shows the error and links it to the control', async () => {
  const screen = await render(
    <Field id="exit-date" label="Date of Exit" error="Date of Exit is required.">
      <input id="exit-date" type="date" />
    </Field>,
  );

  const input = screen.getByLabelText('Date of Exit', { exact: true });
  await expect.element(screen.getByText('Date of Exit is required.')).toBeVisible();
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveAccessibleDescription('Date of Exit is required.');
});

test('without required or error, adds no marks', async () => {
  const screen = await render(
    <Field id="moved" label="Region Moved To">
      <input id="moved" />
    </Field>,
  );

  const input = screen.getByLabelText('Region Moved To', { exact: true });
  await expect.element(input).toBeVisible();
  expect(input.element().hasAttribute('aria-required')).toBe(false);
  expect(input.element().hasAttribute('aria-invalid')).toBe(false);
  expect(screen.getByText('*').elements()).toHaveLength(0);
});

test('links a wrapped control by id without changing it', async () => {
  const screen = await render(
    <Field id="days" label="Days (Read Only)" required>
      <div>
        <input id="days" readOnly value="9" />
        <span>days</span>
      </div>
    </Field>,
  );

  const input = screen.getByLabelText('Days (Read Only)', { exact: true });
  await expect.element(input).toHaveValue('9');
  expect(input.element().hasAttribute('aria-required')).toBe(false);
});
