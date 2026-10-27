import { afterEach, beforeEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import toast from 'react-hot-toast';
import { AxiosError, AxiosHeaders } from 'axios';

import { test } from '../../../../test-extend';

import commonInfoService from '../../../services/common-info.service';
import exitFormService from '../../../services/exit-form.service';
import type { ExitFormOptions, ExitFormRecord } from '../../../types/exit-form';

import ExitFormPage from './ExitFormPage';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

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
  exitPriorToAge3: [
    { code: 7, label: 'Non-EI Client Exit' },
    { code: 8, label: 'Referral to CIS-EI' },
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
  await page.elementLocator(screen.getByLabelText(field(label)).element()).fill(value);
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
  vi.mocked(exitFormService.defaults).mockResolvedValue({ Region: 2, ReferralDate: '2025-02-15' });
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
  for (const name of [
    'Client Information',
    'General Information',
    'Transition Information',
    'Exit Details',
  ]) {
    await expect.element(screen.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  await expect.element(screen.getByLabelText(field('Region'))).toHaveValue('2');
  await expect.element(screen.getByLabelText(field('Date of Referral'))).toHaveValue('2025-02-15');
  await expect.element(screen.getByLabelText(field('Date of Exit'))).toHaveValue('');

  // Removed from the form
  for (const name of ['Status', 'SU #', 'Supervisory Union', 'Town', 'First Name', 'Last Name']) {
    expect(screen.getByLabelText(field(name)).elements()).toHaveLength(0);
  }
  expect(screen.getByText('Compliance Indicators').elements()).toHaveLength(0);

  // Client Information card: no County or Status on the Exit Form.
  await expect.element(screen.getByText('Child Last Name', { exact: true })).toBeVisible();
  for (const name of ['County', 'Status', 'Supervisory Union', 'Service Coordinator']) {
    expect(screen.getByText(name, { exact: true }).elements()).toHaveLength(0);
  }
  expect(exitFormService.defaults).toHaveBeenCalledWith(123);
});

test('Save without Date of Exit shows the error and does not save', async () => {
  const { screen } = await renderPage();

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Date of Exit is required.')).toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith('Please fix the highlighted fields.');
});

test('transition section shows the four day counts, including referral to transition plan', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2026-04-01');
  await fillDate(screen, 'Date Written Transition Plan', '2025-10-01');
  await fillDate(screen, 'LEA Notification Date', '2025-11-01');
  await fillDate(screen, 'Date of Transition Conference', '2025-12-15');

  const days = (label: string) => screen.getByLabelText(field(`${label} (Read Only)`));

  // Referral 2025-02-15 (prefilled) to plan 2025-10-01.
  await expect.element(days('Days Between Referral and Transition Plan')).toHaveValue('228');
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
  await expect.element(screen.getByRole('group', { name: field('Reason for Exit') })).toBeVisible();

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Select the reason for exit.')).toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
});

test('new form: saves only the fields on the form', async () => {
  const { screen, onSaved } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await check(screen.getByRole('radio', { name: 'Moved to other region' }));
  await page
    .elementLocator(screen.getByLabelText(field('Region Moved To')).element())
    .fill('Rutland');
  await check(screen.getByRole('radio', { name: 'Other', exact: true }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(exitFormService.create).toHaveBeenCalledTimes(1));
  expect(exitFormService.create).toHaveBeenCalledWith(123, {
    Region: 2,
    ReferralDate: '2025-02-15',
    ExitDate: '2025-06-01',
    TransitionPlanCompleted: null,
    TransitionPlanReason: null,
    CLLEANotificationDate: null,
    TransitionMeeting: null,
    ExitPriorToAge3: 2,
    MovedOtherRegion: 'Rutland',
    ExitAtAge3: null,
    ReferredTo: 5,
  });
  expect(toast.success).toHaveBeenCalledWith('Exit Form saved successfully.');
  expect(onSaved).toHaveBeenCalled();
});

test('edit form: loads the record and saves changes with update', async () => {
  const { screen } = await renderPage(7);

  await expect.element(screen.getByRole('heading', { name: 'Edit Exit Form' })).toBeVisible();
  await expect.element(screen.getByLabelText(field('Date of Exit'))).toHaveValue('2026-04-01');
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

  await expect.element(screen.getByLabelText(field('Date of Exit'))).toHaveValue('2026-04-01');
  await clickButton(screen, 'Save');

  await expect
    .element(screen.getByText('Date of Transition Conference is required.'))
    .toBeVisible();
  expect(exitFormService.update).not.toHaveBeenCalled();
});

function apiError(message: string) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    data: { message },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

test('shows an error when the form cannot be loaded', async () => {
  vi.mocked(exitFormService.get).mockRejectedValue(apiError('Client not found'));
  const { screen } = await renderPage();

  await expect.element(screen.getByText('Exit Form could not be loaded.')).toBeVisible();
  expect(toast.error).toHaveBeenCalledWith('Client not found');
});

test('uses a fallback message when the load error has none', async () => {
  vi.mocked(exitFormService.options).mockRejectedValue(new Error('boom'));
  const { screen } = await renderPage();

  await expect.element(screen.getByText('Exit Form could not be loaded.')).toBeVisible();
  expect(toast.error).toHaveBeenCalledWith('Failed to load Exit Form.');
});

test('edit form: closes when the record is not found', async () => {
  const { onClose } = await renderPage(99);

  await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith('Exit Form record not found.');
});

test('does not show a loop warning banner', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByRole('heading', { name: 'New Exit Form' })).toBeVisible();
  expect(
    screen.getByText('An Exit normally follows an Active form', { exact: false }).elements(),
  ).toHaveLength(0);
  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});

test('shows the 3rd birthday in the Transition Information description', async () => {
  const { screen } = await renderPage();

  await expect
    .element(screen.getByText('Required when the child exits at age 3. 3rd birthday: 04/10/2026.'))
    .toBeVisible();
});

test('Cancel closes the form without saving', async () => {
  const { screen, onClose } = await renderPage();

  await clickButton(screen, 'Cancel');

  expect(onClose).toHaveBeenCalled();
  expect(exitFormService.create).not.toHaveBeenCalled();
});

test('Save without a region shows the error', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByLabelText(field('Region'))).toHaveValue('2');
  await screen.getByLabelText(field('Region')).selectOptions('0');
  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Region is required.')).toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
});

test('Region Moved To shows only for "Moved to other region"', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await check(screen.getByRole('radio', { name: 'Moved to other region' }));
  await expect.element(screen.getByLabelText(field('Region Moved To'))).toBeVisible();

  await check(screen.getByRole('radio', { name: 'Unable to contact' }));
  expect(screen.getByLabelText(field('Region Moved To')).elements()).toHaveLength(0);
});

test('a path chosen by the user is kept when the exit date changes', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2026-04-01');
  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).toBeChecked();

  await check(screen.getByRole('radio', { name: 'Prior to age 3' }));
  await fillDate(screen, 'Date of Exit', '2026-04-05');

  await expect.element(screen.getByRole('radio', { name: 'Prior to age 3' })).toBeChecked();
});

test('exit at age 3 requires Referred To', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2026-04-01');
  await fillDate(screen, 'Date Written Transition Plan', '2025-10-01');
  await fillDate(screen, 'LEA Notification Date', '2025-11-01');
  await fillDate(screen, 'Date of Transition Conference', '2025-12-15');
  await check(
    screen.getByRole('radio', { name: 'Child is potentially eligible for Part B services' }),
  );
  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Select where the child was referred.')).toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
});

test('NOT eligible for Part B saves without asking why (section removed)', async () => {
  const { screen } = await renderPage(7);

  await expect.element(screen.getByRole('radio', { name: 'At age 3' })).toBeChecked();
  await check(screen.getByRole('radio', { name: 'Child is NOT eligible for Part B' }));

  expect(screen.getByText('Why is the child not eligible for Part B?').elements()).toHaveLength(0);
  expect(screen.getByRole('checkbox').elements()).toHaveLength(0);

  await check(screen.getByRole('radio', { name: 'Exited with no referral' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(exitFormService.update).toHaveBeenCalledTimes(1));
  const payload = vi.mocked(exitFormService.update).mock.calls[0][2];
  expect(payload).toMatchObject({ ExitAtAge3: 4, ReferredTo: 99 });
  expect(payload).not.toHaveProperty('EXFNoPartB1');
});

test('shows the area titles from the requirements', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await expect
    .element(
      screen.getByRole('heading', {
        name: 'Child Exited this region PRIOR TO AGE 3 OR NON-EI Client: Please check one',
      }),
    )
    .toBeVisible();
  await expect
    .element(screen.getByRole('heading', { name: 'Referred to', exact: true }))
    .toBeVisible();

  await check(screen.getByRole('radio', { name: 'At age 3' }));
  await expect
    .element(screen.getByRole('heading', { name: 'Child Exited AT AGE 3' }))
    .toBeVisible();
});

test('prior to age 3 offers the Non-EI and Referral to CIS-EI reasons', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await check(screen.getByRole('radio', { name: 'Non-EI Client Exit' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(exitFormService.create).toHaveBeenCalledTimes(1));
  expect(exitFormService.create).toHaveBeenCalledWith(
    123,
    expect.objectContaining({ ExitPriorToAge3: 7 }),
  );
  expect(screen.getByRole('radio', { name: 'Referral to CIS-EI' }).elements()).toHaveLength(1);
});

test('records the transition plan delay reason', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await fillDate(screen, 'Date Written Transition Plan', '2025-05-01');
  await page
    .elementLocator(screen.getByLabelText(field('Transition Plan Delay Reason')).element())
    .fill('Family circumstance: parent ill');
  await check(screen.getByRole('radio', { name: 'Unable to contact' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(exitFormService.create).toHaveBeenCalledTimes(1));
  expect(exitFormService.create).toHaveBeenCalledWith(
    123,
    expect.objectContaining({
      TransitionPlanCompleted: '2025-05-01',
      TransitionPlanReason: 'Family circumstance: parent ill',
    }),
  );
});

test('edit form: shows the saved delay reason', async () => {
  vi.mocked(exitFormService.get).mockResolvedValue({
    client,
    forms: [{ ...existing, TransitionPlanReason: 'Provider circumstance: staffing' }],
  });
  const { screen } = await renderPage(7);

  await expect
    .element(screen.getByLabelText(field('Transition Plan Delay Reason')))
    .toHaveValue('Provider circumstance: staffing');
});

test('transition plan and LEA dates cannot be before the referral date', async () => {
  const { screen } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await fillDate(screen, 'Date Written Transition Plan', '2025-02-01');
  await fillDate(screen, 'LEA Notification Date', '2025-02-10');
  await check(screen.getByRole('radio', { name: 'Unable to contact' }));
  await clickButton(screen, 'Save');

  await expect
    .element(screen.getByText('Date Written Transition Plan cannot be before Date of Referral.'))
    .toBeVisible();
  await expect
    .element(screen.getByText('LEA Notification Date cannot be before Date of Referral.'))
    .toBeVisible();
  expect(exitFormService.create).not.toHaveBeenCalled();
});

test('shows the API message when saving fails', async () => {
  vi.mocked(exitFormService.create).mockRejectedValue(
    apiError('Date of Exit cannot be before Date of Referral'),
  );
  const { screen, onSaved } = await renderPage();

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await check(screen.getByRole('radio', { name: 'Unable to contact' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith('Date of Exit cannot be before Date of Referral'),
  );
  expect(onSaved).not.toHaveBeenCalled();
  expect(toast.success).not.toHaveBeenCalled();
  await expect.element(screen.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
});

test('closes after saving when there is no onSaved callback', async () => {
  const onClose = vi.fn();
  const screen = await render(<ExitFormPage childId={123} onClose={onClose} />);

  await fillDate(screen, 'Date of Exit', '2025-06-01');
  await check(screen.getByRole('radio', { name: 'Unable to contact' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(exitFormService.create).toHaveBeenCalledTimes(1);
});
