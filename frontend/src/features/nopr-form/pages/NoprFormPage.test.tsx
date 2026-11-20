import { afterEach, beforeEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import toast from 'react-hot-toast';
import { AxiosError, AxiosHeaders } from 'axios';

import { test } from '../../../../test-extend';

import commonInfoService from '../../../services/common-info.service';
import noprFormService from '../../../services/nopr-form.service';
import type { NoprFormOptions, NoprFormRecord } from '../../../types/nopr-form';

import NoprFormPage from './NoprFormPage';

/** Matches a field's label with or without the required "*" that Field / FieldGroup add. */
const field = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`);

vi.mock('../../../services/nopr-form.service', () => ({
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
  DOB: '2024-03-10T00:00:00.000Z',
};

const options: NoprFormOptions = {
  refStatus: [
    { code: 8, label: 'Initial Contact Not Made' },
    { code: 1, label: 'Initial visit made - Screening/evaluation declined' },
    { code: 4, label: 'Evaluated - Not Eligible' },
    { code: 6, label: 'Moved or Lost Contact' },
  ],
  retiredRefStatus: [{ code: 7, label: 'Turned 3 during evaluation process' }],
};

const existing: NoprFormRecord = {
  ID: 7,
  Region: 2,
  RefStatus: 4,
  InitialEvalDate: '2026-01-20 00:00:00',
  StatusDate: '2026-02-02 00:00:00',
  FormDate: '2026-02-02 00:00:00',
};

const STATUS_DATE = 'Date above status was determined';
const EVAL_DATE = 'Date of Initial Evaluation';

async function renderPage(formId?: number) {
  const onClose = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);
  const screen = await render(
    <NoprFormPage childId={123} formId={formId} onClose={onClose} onSaved={onSaved} />,
  );
  return { screen, onClose, onSaved };
}

/* Radios are clicked through the DOM; coordinate clicks miss them in the scaled runner. */
async function check(radio: ReturnType<Screen['getByRole']>) {
  (radio.element() as HTMLInputElement).click();
  await expect.element(radio).toBeChecked();
}

async function fill(screen: Screen, label: string, value: string) {
  await page.elementLocator(screen.getByLabelText(field(label)).element()).fill(value);
}

async function clickButton(screen: Screen, name: string) {
  const button = screen.getByRole('button', { name, exact: true });
  await expect.element(button).toBeVisible();
  (button.element() as HTMLButtonElement).click();
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(noprFormService.get).mockResolvedValue({ client, forms: [existing] });
  vi.mocked(noprFormService.options).mockResolvedValue(options);
  vi.mocked(noprFormService.defaults).mockResolvedValue({
    Region: 3,
    MostRecentReferralDate: '2026-01-05',
  });
  vi.mocked(noprFormService.create).mockResolvedValue({});
  vi.mocked(noprFormService.update).mockResolvedValue({});
  vi.mocked(commonInfoService.regions).mockResolvedValue([
    { ID: 1, RName: 'Burlington' },
    { ID: 2, RName: 'St Albans' },
    { ID: 3, RName: 'Brattleboro' },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('new form: shows the areas, the client and the most recent referral date', async () => {
  const { screen } = await renderPage();

  await expect
    .element(screen.getByRole('heading', { name: 'New No One Plan Resulting Form' }))
    .toBeVisible();
  for (const name of ['Client Information', 'General Information']) {
    await expect.element(screen.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect
    .element(screen.getByRole('heading', { name: /^Status: Referred with No One Plan/ }))
    .toBeVisible();

  for (const text of ['Austin', 'Jane', '123-45-6789', '03/10/2024', '01/05/2026']) {
    await expect.element(screen.getByText(text, { exact: true })).toBeVisible();
  }
  await expect.element(screen.getByLabelText(field('Region'))).toHaveValue('3');
  // The region name shows in the client details (and as the selected dropdown option).
  expect(
    screen
      .getByText('Brattleboro', { exact: true })
      .elements()
      .some((e) => e.tagName === 'DIV'),
  ).toBe(true);
});

test('new form: lists the reasons with Initial Contact Not Made first and no retired reason', async () => {
  const { screen } = await renderPage();

  const radios = screen.getByRole('radio');
  await expect.element(radios.first()).toBeVisible();
  const labels = radios.elements().map((r) => r.closest('label')?.textContent);

  expect(labels).toEqual([
    'Initial Contact Not Made',
    'Initial visit made - Screening/evaluation declined',
    'Evaluated - Not Eligible',
    'Moved or Lost Contact',
  ]);
});

test('date pickers limit the dates and show the rules', async () => {
  const { screen } = await renderPage();

  await expect
    .element(screen.getByLabelText(field(STATUS_DATE)))
    .toHaveAttribute('min', '2026-01-05');
  await expect
    .element(screen.getByLabelText(field(EVAL_DATE)))
    .toHaveAttribute('min', '2024-03-10');
  await expect
    .element(screen.getByText('Cannot be before the most recent referral date (01/05/2026).'))
    .toBeVisible();

  await fill(screen, STATUS_DATE, '2026-02-02');
  await expect
    .element(screen.getByLabelText(field(EVAL_DATE)))
    .toHaveAttribute('max', '2026-02-02');
});

test('Save without answers shows the errors and does not save', async () => {
  vi.mocked(noprFormService.defaults).mockResolvedValue({
    Region: null,
    MostRecentReferralDate: '2026-01-05',
  });
  vi.mocked(noprFormService.get).mockResolvedValue({
    client: { ...client, Region: null },
    forms: [],
  });
  const { screen } = await renderPage();

  await clickButton(screen, 'Save');

  await expect.element(screen.getByText('Region is required.')).toBeVisible();
  await expect.element(screen.getByText('Select the reason a plan was not created.')).toBeVisible();
  await expect
    .element(screen.getByText('Date above status was determined is required.'))
    .toBeVisible();
  expect(toast.error).toHaveBeenCalledWith('Please fix the highlighted fields.');
  expect(noprFormService.create).not.toHaveBeenCalled();
});

test('a status date before the most recent referral shows an error', async () => {
  const { screen } = await renderPage();

  await check(screen.getByRole('radio', { name: 'Evaluated - Not Eligible' }));
  await fill(screen, STATUS_DATE, '2025-12-15');
  await clickButton(screen, 'Save');

  await expect
    .element(screen.getByText('Cannot be before the most recent referral date (01/05/2026).'))
    .toBeVisible();
  expect(noprFormService.create).not.toHaveBeenCalled();
});

test('a Date of Initial Evaluation after the status date shows an error', async () => {
  const { screen } = await renderPage();

  await check(screen.getByRole('radio', { name: 'Evaluated - Not Eligible' }));
  await fill(screen, STATUS_DATE, '2026-02-02');
  await fill(screen, EVAL_DATE, '2026-02-10');
  await clickButton(screen, 'Save');

  await expect
    .element(screen.getByText('Cannot be after the date the status was determined.'))
    .toBeVisible();
  expect(noprFormService.create).not.toHaveBeenCalled();
});

test('new form: saves the reason and both dates', async () => {
  const { screen, onSaved } = await renderPage();

  await check(screen.getByRole('radio', { name: 'Initial Contact Not Made' }));
  await fill(screen, EVAL_DATE, '2026-01-20');
  await fill(screen, STATUS_DATE, '2026-02-02');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(noprFormService.create).toHaveBeenCalled());
  expect(noprFormService.create).toHaveBeenCalledWith(123, {
    Region: 3,
    RefStatus: 8,
    InitialEvalDate: '2026-01-20',
    StatusDate: '2026-02-02',
  });
  expect(toast.success).toHaveBeenCalledWith('NOPR Form saved successfully.');
  expect(onSaved).toHaveBeenCalled();
});

test('new form: Date of Initial Evaluation is optional', async () => {
  const { screen } = await renderPage();

  await check(screen.getByRole('radio', { name: 'Moved or Lost Contact' }));
  await fill(screen, STATUS_DATE, '2026-02-02');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(noprFormService.create).toHaveBeenCalled());
  expect(vi.mocked(noprFormService.create).mock.calls[0][1]).toMatchObject({
    RefStatus: 6,
    InitialEvalDate: null,
  });
});

test('edit form: loads the record and saves changes with update', async () => {
  const { screen, onSaved } = await renderPage(7);

  await expect
    .element(screen.getByRole('heading', { name: 'Edit No One Plan Resulting Form' }))
    .toBeVisible();
  await expect.element(screen.getByLabelText(field('Region'))).toHaveValue('2');
  await expect
    .element(screen.getByRole('radio', { name: 'Evaluated - Not Eligible' }))
    .toBeChecked();
  await expect.element(screen.getByLabelText(field(EVAL_DATE))).toHaveValue('2026-01-20');
  await expect.element(screen.getByLabelText(field(STATUS_DATE))).toHaveValue('2026-02-02');

  await check(screen.getByRole('radio', { name: 'Moved or Lost Contact' }));
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(noprFormService.update).toHaveBeenCalled());
  expect(noprFormService.update).toHaveBeenCalledWith(123, 7, {
    Region: 2,
    RefStatus: 6,
    InitialEvalDate: '2026-01-20',
    StatusDate: '2026-02-02',
  });
  expect(toast.success).toHaveBeenCalledWith('NOPR Form updated successfully.');
  expect(onSaved).toHaveBeenCalled();
});

test('edit form: shows a retired reason only on a form that has it', async () => {
  vi.mocked(noprFormService.get).mockResolvedValue({
    client,
    forms: [{ ...existing, RefStatus: 7 }],
  });
  const { screen } = await renderPage(7);

  await expect
    .element(
      screen.getByRole('radio', { name: 'Turned 3 during evaluation process (no longer used)' }),
    )
    .toBeChecked();
});

test('edit form: closes when the record is not found', async () => {
  const { onClose } = await renderPage(99);

  await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith('NOPR Form record not found.');
});

test('shows a message when the form cannot be loaded', async () => {
  vi.mocked(noprFormService.get).mockRejectedValue(new Error('Network Error'));
  const { screen } = await renderPage();

  await expect.element(screen.getByText('NOPR Form could not be loaded.')).toBeVisible();
  expect(toast.error).toHaveBeenCalledWith('Failed to load NOPR Form.');
});

test('shows the API message when saving fails', async () => {
  vi.mocked(noprFormService.update).mockRejectedValue(
    new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Region must be selected' },
    }),
  );
  const { screen, onSaved } = await renderPage(7);

  await expect.element(screen.getByLabelText(field(STATUS_DATE))).toHaveValue('2026-02-02');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Region must be selected'));
  expect(onSaved).not.toHaveBeenCalled();
});

test('closes after saving when there is no onSaved callback', async () => {
  const onClose = vi.fn();
  const screen = await render(<NoprFormPage childId={123} formId={7} onClose={onClose} />);

  await expect.element(screen.getByLabelText(field(STATUS_DATE))).toHaveValue('2026-02-02');
  await clickButton(screen, 'Save');

  await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
});

test('Cancel closes the form', async () => {
  const { screen, onClose } = await renderPage();

  await clickButton(screen, 'Cancel');

  expect(onClose).toHaveBeenCalled();
});

test('without a date of birth or a referral the date pickers have no lower limit', async () => {
  vi.mocked(noprFormService.get).mockResolvedValue({ client: { ...client, DOB: null }, forms: [] });
  vi.mocked(noprFormService.defaults).mockResolvedValue({
    Region: 3,
    MostRecentReferralDate: null,
  });
  const { screen } = await renderPage();

  await expect.element(screen.getByLabelText(field(STATUS_DATE))).not.toHaveAttribute('min');
  await expect.element(screen.getByLabelText(field(EVAL_DATE))).not.toHaveAttribute('min');
  expect(
    screen.getByText(/Cannot be before the most recent referral date/).elements(),
  ).toHaveLength(0);
});

test('without a referral the status date cannot be before the date of birth', async () => {
  vi.mocked(noprFormService.defaults).mockResolvedValue({
    Region: 3,
    MostRecentReferralDate: null,
  });
  const { screen } = await renderPage();

  await expect
    .element(screen.getByLabelText(field(STATUS_DATE)))
    .toHaveAttribute('min', '2024-03-10');
});

test('still loads when the region list is empty', async () => {
  vi.mocked(commonInfoService.regions).mockResolvedValue(
    null as unknown as Awaited<ReturnType<typeof commonInfoService.regions>>,
  );
  const { screen } = await renderPage();

  await expect
    .element(screen.getByRole('heading', { name: 'New No One Plan Resulting Form' }))
    .toBeVisible();
  expect(screen.getByText('Brattleboro', { exact: true }).elements()).toHaveLength(0);
});

test('shows Saving... and disables the buttons while saving', async () => {
  let finish: (value: NoprFormRecord) => void = () => {};
  vi.mocked(noprFormService.update).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { screen, onSaved } = await renderPage(7);

  await expect.element(screen.getByLabelText(field(STATUS_DATE))).toHaveValue('2026-02-02');
  await clickButton(screen, 'Save');

  await expect.element(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

  finish({});
  await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
});

test('ignores a load that finishes after the form was closed', async () => {
  let finish: (value: Awaited<ReturnType<typeof noprFormService.get>>) => void = () => {};
  vi.mocked(noprFormService.get).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { screen, onClose } = await renderPage(99);

  await screen.unmount();
  finish({ client, forms: [] });
  await new Promise((resolve) => setTimeout(resolve, 50));

  // A record that is not found would close the form and show an error, but only while it is open.
  expect(onClose).not.toHaveBeenCalled();
  expect(toast.error).not.toHaveBeenCalled();
});

test('ignores a load error that arrives after the form was closed', async () => {
  let fail: (reason: Error) => void = () => {};
  vi.mocked(noprFormService.get).mockReturnValue(
    new Promise((_, reject) => {
      fail = reject;
    }),
  );
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { screen } = await renderPage();

  await screen.unmount();
  fail(new Error('Network Error'));
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(toast.error).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalledWith('Failed to load NOPR Form:', expect.anything());
});
