import { afterEach, beforeEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import toast from 'react-hot-toast';

import { test } from '../../../../test-extend';

import commonInfoService from '../../../services/common-info.service';
import exitFormService from '../../../services/exit-form.service';
import type { ExitFormOptions, ExitFormRecord } from '../../../types/exit-form';

import ExitFormPage from './ExitFormPage';

vi.mock('../../../services/exit-form.service', () => ({
  default: {
    get: vi.fn(),
    defaults: vi.fn(),
    options: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../../services/common-info.service', () => ({
  default: { regions: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

type Screen = Awaited<ReturnType<typeof render>>;

const client = {
  ChildID: 123,
  Region: 1,
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: '123-45-6789',
  SSTemp: false,
  DOB: '2023-04-10T00:00:00.000Z',
  Gender: 'F',
  Notes: null,
  NonEarlyIntervention: false,
};

const options: ExitFormOptions = {
  formType: 'Exit',
  exitPriorToAge3: [
    { code: 1, label: 'Development at appropriate level' },
    { code: 2, label: 'Moved to other region' },
    { code: 5, label: 'Unable to contact' },
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
  noPartBReasons: [{ column: 'EXFNoPartB1', label: "Child's development is at appropriate level" }],
};

const existing: ExitFormRecord = {
  ID: 7,
  Region: 2,
  ReferralDate: '2025-02-15T00:00:00.000Z',
  ExitDate: '2026-04-01T00:00:00.000Z',
  TransitionPlanCompleted: '2025-12-01T00:00:00.000Z',
  CLLEANotificationDate: '2025-11-01T00:00:00.000Z',
  TransitionMeeting: '2025-12-15T00:00:00.000Z',
  ExitPriorToAge3: 0,
  ExitAtAge3: 1,
  ReferredTo: 1,
};

async function renderPage(formId?: number) {
  const onClose = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);
  const screen = await render(
    <ExitFormPage childId={123} formId={formId} onClose={onClose} onSaved={onSaved} />,
  );
  return { screen, onClose, onSaved };
}

/* Radios are clicked through the DOM; coordinate clicks miss them in the scaled runner. */
async function check(radio: ReturnType<Screen['getByRole']>) {
  (radio.element() as HTMLInputElement).click();
  await expect.element(radio).toBeChecked();
}

async function fillDate(screen: Screen, label: string, value: string) {
  await page.elementLocator(screen.getByLabelText(label, { exact: true }).element()).fill(value);
}

async function clickButton(screen: Screen, name: string) {
  const button = screen.getByRole('button', { name, exact: true });
  await expect.element(button).toBeVisible();
  (button.element() as HTMLButtonElement).click();
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(exitFormService.get).mockResolvedValue({ client, forms: [existing] });
  vi.mocked(exitFormService.options).mockResolvedValue(options);
  vi.mocked(exitFormService.defaults).mockResolvedValue({
    Region: 2,
    ReferralDate: '2025-02-15',
    previousFormType: 'Referral',
    warnings: ['The most recent form is "Referral".'],
  });
  vi.mocked(exitFormService.create).mockResolvedValue({});
  vi.mocked(exitFormService.update).mockResolvedValue({});
  vi.mocked(commonInfoService.regions).mockResolvedValue([
    { ID: 1, RName: 'Burlington' },
    { ID: 2, RName: 'St Albans' },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('new form: shows only Region, Date of Referral and Date of Exit in General Information', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByRole('heading', { name: 'New Exit Form' })).toBeVisible();
  for (const name of ['Client Information', 'General Information', 'Transition Information', 'Exit Details']) {
    await expect.element(screen.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  await expect.element(screen.getByText('The most recent form is "Referral".')).toBeVisible();
  await expect.element(screen.getByLabelText('Region', { exact: true })).toHaveValue('2');
  await expect.element(screen.getByLabelText('Date of Referral', { exact: true })).toHaveValue('2025-02-15');
  await expect.element(screen.getByLabelText('Date of Exit', { exact: true })).toHaveValue('');

  // Removed from the form
  for (const name of ['Status', 'SU #', 'Supervisory Union', 'Town', 'First Name', 'Last Name']) {
    expect(screen.getByLabelText(name, { exact: true }).elements()).toHaveLength(0);
  }
  expect(screen.getByText('Compliance Indicators').elements()).toHaveLength(0);
  expect(exitFormService.defaults).toHaveBeenCalledWith(123);
});

test('Save without Date of Exit shows the error and does not save', async () => {
  const { screen } = await renderPage();

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Date of Exit is required.')).toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith('Please fix the highlighted fields.');
});

test('transition section shows the four day counts, including the transition plan', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2026-04-01');
  await fillDate(screen, 'Date Written Transition Plan', '2025-10-01');
  await fillDate(screen, "Date LEA Notified of Child's Name", '2025-11-01');
  await fillDate(screen, 'Date of Transition Conference', '2025-12-15');

  const days = (label: string) => screen.getByLabelText(`${label} (Read Only)`, { exact: true });

  await expect.element(days('Days Between Transition Plan and Exit')).toHaveValue('182');
  await expect.element(days('Days Between LEA Notification and Exit')).toHaveValue('151');
  await expect.element(days('Days Between Transition Conference and Exit')).toHaveValue('107');
  await expect.element(days('Days Between Exit and 3rd Birthday')).toHaveValue('9');

  // Exit date is at the 3rd birthday, so "At age 3" is pre-selected.
  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).toBeChecked();
});

test('prior to age 3 requires a reason for exit', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  // ~10 months before the 3rd birthday, so "Prior to age 3" is pre-selected.
  await expect.element(screen.getByRole('radio', { name: 'Prior to age 3' })).toBeChecked();
  await expect.element(screen.getByRole('radiogroup', { name: 'Reason for Exit' })).toBeVisible();

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Select the reason for exit.')).toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
});

test('new form: saves only the fields on the form', async () => {
  const { screen, onSaved } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await check(screen.getByRole('radio', { name: 'Moved to other region' }));
  await page.elementLocator(screen.getByLabelText('Region Moved To', { exact: true }).element()).fill('Rutland');
  await check(screen.getByRole('radio', { name: 'Other', exact: true }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(exitFormService.create).toHaveBeenCalledTimes(1));
  expect(exitFormService.create).toHaveBeenCalledWith(123, {
    Region: 2,
    ReferralDate: '2025-02-15',
    ExitDate: '2025-06-01',
    TransitionPlanCompleted: null,
    CLLEANotificationDate: null,
    TransitionMeeting: null,
    ExitPriorToAge3: 2,
    MovedOtherRegion: 'Rutland',
    ExitAtAge3: null,
    EXFNoPartB1: false,
    EXFNoPartB2: false,
    EXFNoPartB3: false,
    ReferredTo: 5,
  });
  expect(toast.success).toHaveBeenCalledWith('Exit Form saved successfully.');
  expect(onSaved).toHaveBeenCalled();
});

test('edit form: loads the record and saves changes with update', async () => {
  const { screen } = await renderPage(7);

  await expect.element(screen.getByRole('heading', { name: 'Edit Exit Form' })).toBeVisible();
  await expect.element(screen.getByLabelText('Date of Exit', { exact: true })).toHaveValue('2026-04-01');
  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).toBeChecked();
  expect(exitFormService.defaults).not.toHaveBeenCalled();

  await check(screen.getByRole('radio', { name: 'Exited with no referral' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(exitFormService.update).toHaveBeenCalledTimes(1));
  expect(exitFormService.update).toHaveBeenCalledWith(
    123,
    7,
    expect.objectContaining({ ExitAtAge3: 1, ExitPriorToAge3: null, ReferredTo: 99 }),
  );
  expect(toast.success).toHaveBeenCalledWith('Exit Form updated successfully.');
});

test('exit at age 3 requires the transition dates', async () => {
  vi.mocked(exitFormService.get).mockResolvedValue({
    client,
    forms: [{ ...existing, TransitionMeeting: null }],
  });
  const { screen } = await renderPage(7);

  await expect.element(screen.getByLabelText('Date of Exit', { exact: true })).toHaveValue('2026-04-01');
  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Date of Transition Conference is required.')).toBeVisible();
  expect(exitFormService.update).not.toHaveBeenCalled();
});
