import { expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../test-extend';

import { Section, SubSection } from './ExitFormControls';

test('Section shows the title, the description and the content', async () => {
  const screen = await render(
    <Section title="Transition Information" description="Required when the child exits at age 3.">
      <p>Section content</p>
    </Section>,
  );

  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'Transition Information' }))
    .toBeVisible();
  await expect.element(screen.getByText('Required when the child exits at age 3.')).toBeVisible();
  await expect.element(screen.getByText('Section content')).toBeVisible();
});

test('Section without a description shows only the title', async () => {
  const screen = await render(
    <Section title="General Information">
      <p>Content</p>
    </Section>,
  );

  await expect.element(screen.getByRole('heading', { name: 'General Information' })).toBeVisible();
  expect(screen.container.querySelectorAll('p')).toHaveLength(1);
});

test('SubSection shows a level 3 title and the content', async () => {
  const screen = await render(
    <SubSection title="Referred to">
      <p>Options</p>
    </SubSection>,
  );

  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Referred to' }))
    .toBeVisible();
  await expect.element(screen.getByText('Options')).toBeVisible();
});
