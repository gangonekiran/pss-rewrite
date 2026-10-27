import { render } from 'vitest-browser-react';
import { test } from '../../../../test-extend';

import FieldGroup from './FieldGroup.tsx';
import { expect } from 'vitest';

const label = 'Lalalabel';
const error = 'Oh no!';
const child = <input />;

test('renders required fieldgroup with everything present', async () => {
  const screen = await render(
    <FieldGroup label={label} required={true} error={error}>
      {child}
    </FieldGroup>,
  );

  expect(screen.getByText(label + '*')).toBeVisible();
  expect(screen.getByText(error)).toBeVisible();
});

test('renders non-required fieldgroup with no errors', async () => {
  const screen = await render(
    <FieldGroup label={label} required={false}>
      {child}
    </FieldGroup>,
  );

  expect(screen.getByText(label)).toBeVisible();
  expect(screen.getByText('*')).not.toBeInTheDocument();
  expect(screen.getByText(error)).not.toBeInTheDocument();
});

test('renders non-required fieldgroup alternate', async () => {
  const screen = await render(<FieldGroup label={label}>{child}</FieldGroup>);

  expect(screen.getByText(label)).toBeVisible();
  expect(screen.getByText('*')).not.toBeInTheDocument();
  expect(screen.getByText(error)).not.toBeInTheDocument();
});