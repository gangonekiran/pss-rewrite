import { expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import FieldGroup from './FieldGroup';

test('names the group of radios by its label', async () => {
  const screen = await render(
    <FieldGroup label="Referred To">
      <label>
        <input type="radio" name="r" value="1" />
        Head Start
      </label>
    </FieldGroup>,
  );

  const group = screen.getByRole('group', { name: 'Referred To' });
  await expect.element(group).toBeVisible();
  expect(group.element().tagName).toBe('FIELDSET');
  await expect.element(screen.getByRole('radio', { name: 'Head Start' })).toBeVisible();
});

test('shows a required mark that is not part of the group name', async () => {
  const screen = await render(
    <FieldGroup label="Reason for Exit" required>
      <input type="radio" aria-label="Deceased" />
    </FieldGroup>,
  );

  await expect
    .element(screen.getByRole('group', { name: 'Reason for Exit', exact: true }))
    .toBeVisible();
  await expect.element(screen.getByText('*')).toBeVisible();
});

test('tells screen readers the group is required', async () => {
  const screen = await render(
    <FieldGroup label="Reason for Exit" required>
      <input type="radio" aria-label="Deceased" />
    </FieldGroup>,
  );

  const group = screen.getByRole('group', { name: 'Reason for Exit', exact: true });
  await expect.element(group).toHaveAccessibleDescription('Required');
  // Read by screen readers only; the * is the visible mark.
  expect(screen.getByText('Required', { exact: true }).element().className).toContain('sr-only');
});

test('shows the error and links it to the group', async () => {
  const screen = await render(
    <FieldGroup label="Reason for Exit" error="Select the reason for exit.">
      <input type="radio" aria-label="Deceased" />
    </FieldGroup>,
  );

  await expect.element(screen.getByText('Select the reason for exit.')).toBeVisible();
  await expect
    .element(screen.getByRole('group', { name: 'Reason for Exit' }))
    .toHaveAccessibleDescription('Select the reason for exit.');
});

test('describes a required group with an error as both', async () => {
  const screen = await render(
    <FieldGroup label="Reason for Exit" required error="Select the reason for exit.">
      <input type="radio" aria-label="Deceased" />
    </FieldGroup>,
  );

  await expect
    .element(screen.getByRole('group', { name: 'Reason for Exit', exact: true }))
    .toHaveAccessibleDescription('Required Select the reason for exit.');
});

test('without required or error, shows only the label and options', async () => {
  const screen = await render(
    <FieldGroup label="Referred To">
      <input type="radio" aria-label="Other" />
    </FieldGroup>,
  );

  const group = screen.getByRole('group', { name: 'Referred To' });
  await expect.element(group).toBeVisible();
  expect(group.element().hasAttribute('aria-describedby')).toBe(false);
  expect(screen.getByText('*').elements()).toHaveLength(0);
  expect(screen.getByText('Required').elements()).toHaveLength(0);
  expect(screen.container.querySelectorAll('p')).toHaveLength(0);
});
