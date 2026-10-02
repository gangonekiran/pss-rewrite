import { afterEach, beforeEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import toast from 'react-hot-toast';

import { test } from '../../../../test-extend';

import inputFormService from '../../../services/input-form.service';
import type { RegionLookup } from '../../../types/common';

import COSFormPage from './COSFormPage';

vi.mock('../../../services/input-form.service', () => ({
  default: {
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const regions: RegionLookup[] = [
  { ID: 1, RName: 'North' },
  { ID: 2, RName: 'South' },
];

const existingForm = {
  FormDate: '2024-03-01T00:00:00.000Z',
  FormType: 'COS',
  Region: 2,
  OnePlanDate: '2024-02-15T00:00:00.000Z',
  EntryOrExit: 0,
  ExitDate: '2024-06-30T00:00:00.000Z',
  Outcome1: 5,
  Outcome1Support: 1,
  Outcome2: '3',
  Outcome2Support: '0',
  Outcome3: 7,
  Outcome3Support: 1,
};

type Screen = Awaited<ReturnType<typeof render>>;

async function renderPage(
  props: Partial<Parameters<typeof COSFormPage>[0]> = {},
) {
  const onClose = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);

  const screen = await render(
    <COSFormPage
      childId={123}
      regions={regions}
      onClose={onClose}
      onSaved={onSaved}
      {...props}
    />,
  );

  return { screen, onClose, onSaved };
}

/*
 * Field labels are not linked to their inputs (no htmlFor/id), so the two
 * date inputs are read from the DOM: [0] One Plan Date, [1] Exit Date.
 */
function getDateInputs(container: HTMLElement) {
  const inputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');

  if (inputs.length !== 2) {
    throw new Error(`Expected 2 date inputs, found ${inputs.length}`);
  }

  return { onePlanDate: inputs[0], exitDate: inputs[1] };
}

/*
 * Types the date through the browser (Playwright) so React sees a real
 * change. Setting .value directly is not reliable in a headed browser.
 */
async function fillDate(input: HTMLInputElement, value: string) {
  await page.elementLocator(input).fill(value);
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/*
 * Selects a radio with a DOM click. In the headed runner the test iframe is
 * drawn scaled down, and Playwright's coordinate click misses small targets
 * such as these radios (no click reaches the page). A DOM click fires the
 * same click/change events React listens to.
 */
async function check(radio: ReturnType<Screen['getByRole']>) {
  (radio.element() as HTMLInputElement).click();

  await expect.element(radio).toBeChecked();
}

/*
 * Each outcome renders score radios 1-7 and Yes/No radios, so the same
 * label appears three times. `outcome` is 1-based, like the headings.
 */
function scoreRadio(screen: Screen, outcome: number, score: number) {
  return screen.getByRole('radio', { name: String(score), exact: true }).nth(outcome - 1);
}

function progressRadio(screen: Screen, outcome: number, answer: 'Yes' | 'No') {
  return screen.getByRole('radio', { name: answer, exact: true }).nth(outcome - 1);
}

async function fillValidEntryForm(screen: Screen) {
  await screen.getByRole('combobox').selectOptions('2');

  await fillDate(getDateInputs(screen.container).onePlanDate, '2024-02-15');

  await check(scoreRadio(screen, 1, 4));
  await check(progressRadio(screen, 1, 'Yes'));
  await check(scoreRadio(screen, 2, 5));
  await check(progressRadio(screen, 2, 'No'));
  await check(scoreRadio(screen, 3, 6));
  await check(progressRadio(screen, 3, 'Yes'));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(inputFormService.getOne).mockResolvedValue(existingForm);
  vi.mocked(inputFormService.create).mockResolvedValue({});
  vi.mocked(inputFormService.update).mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* =========================================================
   RENDERING (NEW FORM)
========================================================= */

test('renders the title, sections and the three outcomes', async () => {
  const { screen } = await renderPage();

  await expect
    .element(screen.getByRole('heading', { name: 'Child Outcome Summary (COS)' }))
    .toBeVisible();
  await expect.element(screen.getByRole('heading', { name: 'General Information' })).toBeVisible();
  await expect.element(screen.getByRole('heading', { name: 'Outcomes' })).toBeVisible();

  await expect
    .element(
      screen.getByRole('heading', {
        name: 'Outcome 1: Positive Social-Emotional Skills (including Social Relationships)',
      }),
    )
    .toBeVisible();
  await expect
    .element(
      screen.getByRole('heading', { name: 'Outcome 2: Acquiring and Using Knowledge and Skills' }),
    )
    .toBeVisible();
  await expect
    .element(screen.getByRole('heading', { name: 'Outcome 3: Taking Action to Meet Needs' }))
    .toBeVisible();
});

test('renders a region option for each region passed in', async () => {
  const { screen } = await renderPage();

  const select = screen.getByRole('combobox');

  await expect.element(select).toHaveValue('');
  await expect.element(screen.getByRole('option', { name: 'Select region' })).toBeInTheDocument();
  await expect.element(screen.getByRole('option', { name: 'North' })).toBeInTheDocument();
  await expect.element(screen.getByRole('option', { name: 'South' })).toBeInTheDocument();
});

test('starts a new form as an empty Entry COS with Exit Date disabled', async () => {
  const { screen } = await renderPage();

  const { onePlanDate, exitDate } = getDateInputs(screen.container);

  await expect.element(screen.getByRole('radio', { name: 'Entry' })).toBeChecked();
  await expect.element(screen.getByRole('radio', { name: 'Exit' })).not.toBeChecked();

  expect(onePlanDate.value).toBe('');
  expect(exitDate.value).toBe('');
  expect(exitDate.disabled).toBe(true);

  // 3 outcomes x (7 scores + Yes/No), none selected
  const outcomeRadios = screen.container.querySelectorAll<HTMLInputElement>(
    'input[type="radio"][name^="outcome-"]',
  );

  expect(outcomeRadios).toHaveLength(27);
  expect([...outcomeRadios].some((radio) => radio.checked)).toBe(false);
});

test('does not load a form when no formId is given', async () => {
  const { screen } = await renderPage();

  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeVisible();

  expect(inputFormService.getOne).not.toHaveBeenCalled();
});

/* =========================================================
   LOADING AN EXISTING FORM
========================================================= */

test('shows a loading message while the form loads', async () => {
  // "!" avoids TypeScript narrowing this to `undefined` inside the closure below
  let resolveForm!: (value: Record<string, unknown>) => void;

  vi.mocked(inputFormService.getOne).mockReturnValue(
    new Promise((resolve) => {
      resolveForm = resolve;
    }),
  );

  const { screen } = await renderPage({ formId: 77 });

  await expect.element(screen.getByText('Loading COS form...')).toBeVisible();

  resolveForm(existingForm);

  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect.element(screen.getByText('Loading COS form...')).not.toBeInTheDocument();
});

test('loads the existing form for the child and form id', async () => {
  await renderPage({ formId: 77 });

  await vi.waitFor(() => {
    expect(inputFormService.getOne).toHaveBeenCalledWith('cos-cover', 123, 77);
  });
});

test('fills the fields from the loaded form', async () => {
  const { screen } = await renderPage({ formId: 77 });

  await expect.element(screen.getByRole('combobox')).toHaveValue('2');

  const { onePlanDate, exitDate } = getDateInputs(screen.container);

  // ISO date-times are cut to YYYY-MM-DD
  expect(onePlanDate.value).toBe('2024-02-15');
  expect(exitDate.value).toBe('2024-06-30');
  expect(exitDate.disabled).toBe(false);

  await expect.element(screen.getByRole('radio', { name: 'Exit' })).toBeChecked();

  await expect.element(scoreRadio(screen, 1, 5)).toBeChecked();
  await expect.element(progressRadio(screen, 1, 'Yes')).toBeChecked();

  // String values from the API are parsed as numbers
  await expect.element(scoreRadio(screen, 2, 3)).toBeChecked();
  await expect.element(progressRadio(screen, 2, 'No')).toBeChecked();

  await expect.element(scoreRadio(screen, 3, 7)).toBeChecked();
  await expect.element(progressRadio(screen, 3, 'Yes')).toBeChecked();
});

test('treats EntryOrExit -1 as Entry and leaves missing values empty', async () => {
  vi.mocked(inputFormService.getOne).mockResolvedValue({
    FormDate: '2024-03-01',
    EntryOrExit: -1,
    Region: null,
    OnePlanDate: null,
    ExitDate: null,
    Outcome1: null,
    Outcome1Support: '',
    Outcome2: 'abc',
    Outcome2Support: null,
    Outcome3: null,
    Outcome3Support: null,
  });

  const { screen } = await renderPage({ formId: 77 });

  await expect.element(screen.getByRole('radio', { name: 'Entry' })).toBeChecked();
  await expect.element(screen.getByRole('combobox')).toHaveValue('');

  const { onePlanDate, exitDate } = getDateInputs(screen.container);

  expect(onePlanDate.value).toBe('');
  expect(exitDate.disabled).toBe(true);

  const checkedOutcomes = screen.container.querySelectorAll(
    'input[type="radio"][name^="outcome-"]:checked',
  );

  expect(checkedOutcomes).toHaveLength(0);
});

test('shows an error when the form cannot be loaded', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(inputFormService.getOne).mockRejectedValue(new Error('Load failed'));

  const { screen } = await renderPage({ formId: 77 });

  await expect.element(screen.getByText('Unable to load COS form.')).toBeVisible();

  expect(consoleError).toHaveBeenCalled();
});

/* =========================================================
   ENTRY / EXIT
========================================================= */

test('enables Exit Date when Exit is selected', async () => {
  const { screen } = await renderPage();

  await check(screen.getByRole('radio', { name: 'Exit' }));

  await expect.element(screen.getByRole('radio', { name: 'Exit' })).toBeChecked();

  await vi.waitFor(() => {
    expect(getDateInputs(screen.container).exitDate.disabled).toBe(false);
  });
});

test('clears and disables Exit Date when switching back to Entry', async () => {
  const { screen } = await renderPage();

  await check(screen.getByRole('radio', { name: 'Exit' }));

  const { exitDate } = getDateInputs(screen.container);

  await vi.waitFor(() => {
    expect(exitDate.disabled).toBe(false);
  });

  await fillDate(exitDate, '2024-06-30');

  await vi.waitFor(() => {
    expect(exitDate.value).toBe('2024-06-30');
  });

  await check(screen.getByRole('radio', { name: 'Entry' }));

  await vi.waitFor(() => {
    expect(exitDate.value).toBe('');
    expect(exitDate.disabled).toBe(true);
  });
});

/* =========================================================
   VALIDATION
========================================================= */

test('shows every required-field error when saving an empty form', async () => {
  const { screen } = await renderPage();

  await screen.getByRole('button', { name: 'Save' }).click();

  await expect.element(screen.getByText('Region is required.')).toBeVisible();
  await expect.element(screen.getByText('One Plan Date is required.')).toBeVisible();

  await vi.waitFor(() => {
    expect(screen.getByText('COS Score is required.').elements()).toHaveLength(3);
    expect(screen.getByText('Progress Met is required.').elements()).toHaveLength(3);
  });

  // Entry COS does not need an exit date
  await expect
    .element(screen.getByText('Exit Date is required for an Exit COS.'))
    .not.toBeInTheDocument();

  expect(inputFormService.create).not.toHaveBeenCalled();
  expect(inputFormService.update).not.toHaveBeenCalled();
});

test('requires an Exit Date for an Exit COS', async () => {
  const { screen, onSaved } = await renderPage();

  await fillValidEntryForm(screen);
  await check(screen.getByRole('radio', { name: 'Exit' }));
  await screen.getByRole('button', { name: 'Save' }).click();

  await expect.element(screen.getByText('Exit Date is required for an Exit COS.')).toBeVisible();

  expect(inputFormService.create).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();
});

test('clears validation errors when a field changes', async () => {
  const { screen } = await renderPage();

  await screen.getByRole('button', { name: 'Save' }).click();

  await expect.element(screen.getByText('Region is required.')).toBeVisible();

  await screen.getByRole('combobox').selectOptions('1');

  await expect.element(screen.getByText('Region is required.')).not.toBeInTheDocument();
  await expect.element(screen.getByText('One Plan Date is required.')).not.toBeInTheDocument();
});

/* =========================================================
   SAVE
========================================================= */

test('creates a new Entry COS with the expected payload', async () => {
  const { screen, onSaved } = await renderPage();

  await fillValidEntryForm(screen);
  await screen.getByRole('button', { name: 'Save' }).click();

  await vi.waitFor(() => {
    expect(inputFormService.create).toHaveBeenCalledWith('cos-cover', 123, {
      FormDate: formatLocalDate(new Date()),
      FormType: 'COS',
      Region: '2',
      OnePlanDate: '2024-02-15',
      EntryOrExit: -1,
      ExitDate: undefined,
      Outcome1: 4,
      Outcome1Support: 1,
      Outcome2: 5,
      Outcome2Support: 0,
      Outcome3: 6,
      Outcome3Support: 1,
    });
  });

  await vi.waitFor(() => {
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  expect(toast.success).toHaveBeenCalledWith('COS Form added successfully.');
  expect(inputFormService.update).not.toHaveBeenCalled();
});

test('sends the Exit Date when saving an Exit COS', async () => {
  const { screen } = await renderPage();

  await fillValidEntryForm(screen);
  await check(screen.getByRole('radio', { name: 'Exit' }));

  const { exitDate } = getDateInputs(screen.container);

  await vi.waitFor(() => {
    expect(exitDate.disabled).toBe(false);
  });

  await fillDate(exitDate, '2024-06-30');

  await vi.waitFor(() => {
    expect(exitDate.value).toBe('2024-06-30');
  });

  await screen.getByRole('button', { name: 'Save' }).click();

  await vi.waitFor(() => {
    expect(inputFormService.create).toHaveBeenCalledWith(
      'cos-cover',
      123,
      expect.objectContaining({
        EntryOrExit: 0,
        ExitDate: '2024-06-30',
      }),
    );
  });
});

test('updates an existing form', async () => {
  const { screen, onSaved } = await renderPage({ formId: 77 });

  await expect.element(screen.getByRole('combobox')).toHaveValue('2');

  await check(scoreRadio(screen, 1, 6));
  await screen.getByRole('button', { name: 'Save' }).click();

  await vi.waitFor(() => {
    expect(inputFormService.update).toHaveBeenCalledWith('cos-cover', 123, 77, {
      FormDate: '2024-03-01',
      FormType: 'COS',
      Region: '2',
      OnePlanDate: '2024-02-15',
      EntryOrExit: 0,
      ExitDate: '2024-06-30',
      Outcome1: 6,
      Outcome1Support: 1,
      Outcome2: 3,
      Outcome2Support: 0,
      Outcome3: 7,
      Outcome3Support: 1,
    });
  });

  await vi.waitFor(() => {
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  expect(toast.success).toHaveBeenCalledWith('COS Form updated successfully.');
  expect(inputFormService.create).not.toHaveBeenCalled();
});

test('shows an error and does not call onSaved when saving fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(inputFormService.create).mockRejectedValue(new Error('Save failed'));

  const { screen, onSaved } = await renderPage();

  await fillValidEntryForm(screen);
  await screen.getByRole('button', { name: 'Save' }).click();

  await expect.element(screen.getByText('Unable to save COS form.')).toBeVisible();

  expect(toast.error).toHaveBeenCalledWith('Unable to save COS form.');
  expect(onSaved).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalled();

  // Buttons are enabled again so the user can retry
  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
});

test('shows Saving... and disables both buttons while saving', async () => {
  // "!" avoids TypeScript narrowing this to `undefined` inside the closure below
  let resolveCreate!: (value: Record<string, unknown>) => void;

  vi.mocked(inputFormService.create).mockReturnValue(
    new Promise((resolve) => {
      resolveCreate = resolve;
    }),
  );

  const { screen } = await renderPage();

  await fillValidEntryForm(screen);
  await screen.getByRole('button', { name: 'Save' }).click();

  await expect.element(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

  resolveCreate({});

  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
});

/* =========================================================
   CANCEL
========================================================= */

test('calls onClose when Cancel is clicked', async () => {
  const { screen, onClose } = await renderPage();

  await screen.getByRole('button', { name: 'Cancel' }).click();

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(inputFormService.create).not.toHaveBeenCalled();
});
