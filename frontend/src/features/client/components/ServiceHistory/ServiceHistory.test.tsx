import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import ServiceHistory from './ServiceHistory';
import type { ServiceHistoryItem } from './ServiceHistoryItem';

const createService = (overrides: Partial<ServiceHistoryItem> = {}): ServiceHistoryItem => ({
  id: 1,
  date: '2024-01-15',
  serviceName: 'Speech Therapy',
  frequency: '2x/week',
  consent: 'Yes',
  casePlan: 'Open',
  ...overrides,
});

/*
 * The header has buttons named "Freq.", "Consent" and "Case Plan", and the
 * table has column headers with the same text. Query them by role so the
 * two never collide (getByText would match both).
 */

/* =========================================================
   HEADER
========================================================= */

test('renders the Service History title', async () => {
  const screen = await render(<ServiceHistory services={[]} />);

  await expect
    .element(screen.getByRole('heading', { name: 'Service History', exact: true }))
    .toBeVisible();
});

test('renders the Freq., Consent and Case Plan header buttons', async () => {
  const screen = await render(<ServiceHistory services={[]} />);

  await expect.element(screen.getByRole('button', { name: 'Freq.', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Consent', exact: true })).toBeVisible();
  await expect
    .element(screen.getByRole('button', { name: 'Case Plan', exact: true }))
    .toBeVisible();
});

/* =========================================================
   EMPTY STATE
========================================================= */

test('shows the empty message when there are no services', async () => {
  const screen = await render(<ServiceHistory services={[]} />);

  await expect.element(screen.getByText('No service history available.')).toBeVisible();
});

test('does not render the table when there are no services', async () => {
  const screen = await render(<ServiceHistory services={[]} />);

  await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
});

/* =========================================================
   TABLE
========================================================= */

test('renders the table column headers when services exist', async () => {
  const screen = await render(<ServiceHistory services={[createService()]} />);

  await expect.element(screen.getByRole('table')).toBeVisible();

  await expect.element(screen.getByRole('cell', { name: 'Date', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Service', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Freq.', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Consent', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Case Plan', exact: true })).toBeVisible();
});

test('does not show the empty message when services exist', async () => {
  const screen = await render(<ServiceHistory services={[createService()]} />);

  await expect.element(screen.getByText('No service history available.')).not.toBeInTheDocument();
});

test('renders the values of a service row', async () => {
  const screen = await render(<ServiceHistory services={[createService()]} />);

  await expect.element(screen.getByText('2024-01-15', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Speech Therapy', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('2x/week', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Yes', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Open', { exact: true })).toBeVisible();
});

test('renders one row per service', async () => {
  const screen = await render(
    <ServiceHistory
      services={[
        createService({ id: 1, serviceName: 'Speech Therapy' }),
        createService({ id: 2, serviceName: 'Occupational Therapy' }),
        createService({ id: 3, serviceName: 'Physical Therapy' }),
      ]}
    />,
  );

  await expect.element(screen.getByText('Speech Therapy', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Occupational Therapy', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Physical Therapy', { exact: true })).toBeVisible();

  // 1 header row + 3 service rows
  await vi.waitFor(() => {
    expect(screen.getByRole('row').elements()).toHaveLength(4);
  });
});

test('switches from the empty state to the table when services arrive', async () => {
  const screen = await render(<ServiceHistory services={[]} />);

  await expect.element(screen.getByText('No service history available.')).toBeVisible();

  await screen.rerender(<ServiceHistory services={[createService()]} />);

  await expect.element(screen.getByText('No service history available.')).not.toBeInTheDocument();
  await expect.element(screen.getByText('Speech Therapy', { exact: true })).toBeVisible();
});

/* =========================================================
   CONSENT BADGE
========================================================= */

test('shows a green badge when consent is Yes', async () => {
  const screen = await render(<ServiceHistory services={[createService({ consent: 'Yes' })]} />);

  const badge = screen.getByText('Yes', { exact: true });

  await expect.element(badge).toHaveClass('bg-green-100');
  await expect.element(badge).toHaveClass('text-green-700');
});

test('shows a yellow badge when consent is Pending', async () => {
  const screen = await render(
    <ServiceHistory services={[createService({ consent: 'Pending' })]} />,
  );

  const badge = screen.getByText('Pending', { exact: true });

  await expect.element(badge).toHaveClass('bg-yellow-100');
  await expect.element(badge).toHaveClass('text-yellow-700');
});

test('shows a red badge for any other consent value', async () => {
  const screen = await render(<ServiceHistory services={[createService({ consent: 'No' })]} />);

  const badge = screen.getByText('No', { exact: true });

  await expect.element(badge).toHaveClass('bg-red-100');
  await expect.element(badge).toHaveClass('text-red-700');
});

/* =========================================================
   CASE PLAN BADGE
========================================================= */

test('shows a blue badge when the case plan is Open', async () => {
  const screen = await render(<ServiceHistory services={[createService({ casePlan: 'Open' })]} />);

  const badge = screen.getByText('Open', { exact: true });

  await expect.element(badge).toHaveClass('bg-blue-100');
  await expect.element(badge).toHaveClass('text-blue-700');
});

test('shows a gray badge when the case plan is not Open', async () => {
  const screen = await render(
    <ServiceHistory services={[createService({ casePlan: 'Closed' })]} />,
  );

  const badge = screen.getByText('Closed', { exact: true });

  await expect.element(badge).toHaveClass('bg-gray-100');
  await expect.element(badge).toHaveClass('text-gray-700');
});
