import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import inputFormService from '../../../../services/input-form.service';
import type { RegionLookup } from '../../../../types/common';
import type { InputFormHistoryItem } from '../../../../types/input-form';

import InputForms from './InputForms';

vi.mock('../../../../services/input-form.service', () => ({
  default: {
    getHistory: vi.fn(),
    remove: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

/*
 * INPUT_FORM_OPTIONS is mocked so the tests do not depend on the real
 * list of forms. Order matters: checkbox index 0 is "check all", then one
 * checkbox per option in this order.
 */
vi.mock('../../../../types/input-form', () => ({
  INPUT_FORM_OPTIONS: [
    { name: 'referral', label: 'Referral Entry' },
    { name: 'active', label: 'Active Entry' },
    { name: 'cos-cover', label: 'COS Entry' },
    { name: 'exit', label: 'Exit Entry' },
  ],
}));

vi.mock('../../../active-form/pages/ActiveFormPage', () => ({
  default: ({
    childId,
    formId,
    onClose,
    onSaved,
  }: {
    childId: number;
    formId?: number;
    onClose: () => void;
    onSaved: () => Promise<void>;
  }) => (
    <div data-testid="active-form-page">
      <p>Active page child: {childId}</p>
      <p>Active page form: {String(formId)}</p>
      <button type="button" onClick={onClose}>
        Close active page
      </button>
      <button type="button" onClick={() => void onSaved()}>
        Save active page
      </button>
    </div>
  ),
}));

vi.mock('../../../cos', () => ({
  COSFormPage: ({
    childId,
    formId,
    regions,
    onClose,
    onSaved,
  }: {
    childId: number;
    formId?: number;
    regions: unknown[];
    onClose: () => void;
    onSaved: () => Promise<void>;
  }) => (
    <div data-testid="cos-form-page">
      <p>COS page child: {childId}</p>
      <p>COS page form: {String(formId)}</p>
      <p>COS page regions: {regions.length}</p>
      <button type="button" onClick={onClose}>
        Close COS page
      </button>
      <button type="button" onClick={() => void onSaved()}>
        Save COS page
      </button>
    </div>
  ),
}));

const regions = [
  { ID: 1, RName: 'Region 1' },
  { ID: 2, RName: 'Region 2' },
] as RegionLookup[];

/*
 * Dates include a time part without "Z" so they parse as local time and
 * format the same way in every time zone.
 */
const createItem = (overrides: Partial<InputFormHistoryItem> = {}): InputFormHistoryItem =>
  ({
    id: 1,
    formName: 'referral',
    formType: 'Referral Packet',
    date: '2024-01-15T00:00:00',
    referral: '2024-01-16T00:00:00',
    nopr: '2024-02-20T00:00:00',
    interim: '2024-03-10T00:00:00',
    op: '2024-04-25T00:00:00',
    exit: '2024-05-30T00:00:00',
    loopError: false,
    ...overrides,
  }) as unknown as InputFormHistoryItem;

async function renderInputForms(childId: number | null = 123) {
  const screen = await render(<InputForms childId={childId ?? undefined} regions={regions} />);

  return { screen };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function getDateInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="date"]');

  if (!input) {
    throw new Error('Date input not found');
  }

  return input;
}

/*
 * React only reacts to input events that follow the native value setter.
 */
function setDateValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;

  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(inputFormService.getHistory).mockResolvedValue([]);
  vi.mocked(inputFormService.remove).mockResolvedValue(undefined as never);
  vi.mocked(inputFormService.create).mockResolvedValue(undefined as never);
  vi.mocked(inputFormService.update).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* =========================================================
   NO CLIENT
========================================================= */

test('shows a message and does not load when no client is selected', async () => {
  const { screen } = await renderInputForms(null);

  await expect.element(screen.getByText('Select a client to view input forms.')).toBeVisible();

  expect(inputFormService.getHistory).not.toHaveBeenCalled();
});

/* =========================================================
   LOADING HISTORY
========================================================= */

test('loads input form history for the client', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem()]);

  const { screen } = await renderInputForms();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledWith(123);
  });

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();
});

test('shows Loading while history is loading', async () => {
  const deferred = createDeferred<InputFormHistoryItem[]>();

  vi.mocked(inputFormService.getHistory).mockReturnValue(deferred.promise);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Loading input forms...')).toBeVisible();

  deferred.resolve([createItem()]);

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Loading input forms...')).not.toBeInTheDocument();
});

test('shows an empty message when there are no forms', async () => {
  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('No input forms available.')).toBeVisible();
});

test('shows an error when history fails to load', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(inputFormService.getHistory).mockRejectedValue(new Error('History failed'));

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Unable to load input forms.')).toBeVisible();

  expect(consoleError).toHaveBeenCalled();
});

test('reloads history when the client changes', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([]);

  const { screen } = await renderInputForms(123);

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledWith(123);
  });

  await screen.rerender(<InputForms childId={456} regions={regions} />);

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledWith(456);
  });
});

test('shows the select-client message when the client is cleared', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem()]);

  const { screen } = await renderInputForms(123);

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();

  await screen.rerender(<InputForms childId={undefined} regions={regions} />);

  await expect.element(screen.getByText('Select a client to view input forms.')).toBeVisible();
});

test('ignores a stale response after the client changes', async () => {
  const first = createDeferred<InputFormHistoryItem[]>();
  const second = createDeferred<InputFormHistoryItem[]>();

  vi.mocked(inputFormService.getHistory).mockImplementation((childId: number) =>
    childId === 123 ? first.promise : second.promise,
  );

  const { screen } = await renderInputForms(123);

  await screen.rerender(<InputForms childId={456} regions={regions} />);

  second.resolve([createItem({ id: 2, formName: 'exit', formType: 'Exit Summary' })]);

  await expect.element(screen.getByText('Exit Summary', { exact: true })).toBeVisible();

  // The slow response for the previous client arrives last
  first.resolve([createItem({ id: 1, formName: 'referral', formType: 'Referral Packet' })]);

  await new Promise((resolve) => setTimeout(resolve, 100));

  await expect.element(screen.getByText('Referral Packet', { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Exit Summary', { exact: true })).toBeVisible();
});

/* =========================================================
   TABLE CONTENT
========================================================= */

test('formats dates in the history row', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem()]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('1/15/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('1/16/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('2/20/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('3/10/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('4/25/2024', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('5/30/2024', { exact: true })).toBeVisible();
});

test('renders a dash for missing dates and no loop error', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({
      referral: null,
      nopr: null,
      interim: null,
      op: null,
      exit: null,
    } as unknown as Partial<InputFormHistoryItem>),
  ]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();

  // referral, NOPR, interim, OP, exit + the empty loop error cell
  const dashes = screen.getByText('–', { exact: true });

  await vi.waitFor(() => {
    expect(dashes.elements()).toHaveLength(6);
  });
});

test('returns an unparseable date as-is', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ date: 'not-a-date' }),
  ]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('not-a-date', { exact: true })).toBeVisible();
});

test('shows a loop error marker when the form has a loop error', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem({ loopError: true })]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByTitle('Loop error')).toBeVisible();
});

test('shows Active in green for Active One Plan forms', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ formName: 'active', formType: 'Active One Plan' }),
  ]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Active', { exact: true })).toHaveClass('text-green-700');
});

test('shows Active for aop-capta forms', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ formName: 'active', formType: 'aop-capta' }),
  ]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Active', { exact: true })).toBeVisible();
});

test('shows service form types in purple', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ formName: 'exit', formType: 'Service Grid' }),
  ]);

  const { screen } = await renderInputForms();

  await expect
    .element(screen.getByText('Service Grid', { exact: true }))
    .toHaveClass('text-purple-700');
});

test('shows other form types in blue', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem()]);

  const { screen } = await renderInputForms();

  await expect
    .element(screen.getByText('Referral Packet', { exact: true }))
    .toHaveClass('text-blue-700');
});

/* =========================================================
   SHOW / HIDE FILTERS
========================================================= */

test('all form type checkboxes are checked by default', async () => {
  const { screen } = await renderInputForms();

  const checkboxes = screen.getByRole('checkbox');

  await vi.waitFor(() => {
    expect(checkboxes.elements()).toHaveLength(5);
  });

  for (let index = 0; index < 5; index++) {
    await expect.element(checkboxes.nth(index)).toBeChecked();
  }
});

test('unchecking a form type hides its rows', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 1, formName: 'referral', formType: 'Referral Packet' }),
    createItem({ id: 2, formName: 'exit', formType: 'Exit Summary' }),
  ]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Exit Summary', { exact: true })).toBeVisible();

  // 0 = check all, 1 = referral
  await screen.getByRole('checkbox').nth(1).click();

  await expect.element(screen.getByText('Referral Packet', { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Exit Summary', { exact: true })).toBeVisible();

  // Unchecking one form type unchecks "check all"
  await expect.element(screen.getByRole('checkbox').nth(0)).not.toBeChecked();
});

test('check all hides and shows every form type', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 1, formName: 'referral', formType: 'Referral Packet' }),
    createItem({ id: 2, formName: 'exit', formType: 'Exit Summary' }),
  ]);

  const { screen } = await renderInputForms();

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();

  const checkAll = screen.getByRole('checkbox').nth(0);
  const el = checkAll.element() as HTMLInputElement;

  const rect = el.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);

  console.log('viewport width:', window.innerWidth);
  console.log('check-all rect:', JSON.stringify(rect));
  console.log('hit target is check-all:', hit === el, hit?.outerHTML);

  el.click();

  await expect.element(screen.getByText('No input forms available.')).toBeVisible();
  await expect.element(screen.getByRole('checkbox').nth(1)).not.toBeChecked();

  el.click();

  await expect.element(screen.getByText('Referral Packet', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Exit Summary', { exact: true })).toBeVisible();
});

/* =========================================================
   GENERIC INPUT FORM EDITOR
========================================================= */

test('opens the editor when an Add New Form button is clicked', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Referral Entry', exact: true }).click();

  await expect
    .element(screen.getByRole('heading', { name: 'Add New Referral Entry Form' }))
    .toBeVisible();

  await expect.element(screen.getByText('Client ID: 123')).toBeVisible();
});

test('closes the editor when Cancel is clicked', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Referral Entry', exact: true }).click();

  await expect
    .element(screen.getByRole('heading', { name: 'Add New Referral Entry Form' }))
    .toBeVisible();

  await screen.getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect
    .element(screen.getByRole('heading', { name: 'Add New Referral Entry Form' }))
    .not.toBeInTheDocument();
});

test('requires a form date before saving', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Referral Entry', exact: true }).click();
  await screen.getByRole('button', { name: 'Save', exact: true }).click();

  await expect.element(screen.getByText('Form Date is required.')).toBeVisible();

  expect(inputFormService.create).not.toHaveBeenCalled();
});

test('creates a new form and reloads the history', async () => {
  const { screen } = await renderInputForms();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(1);
  });

  await screen.getByRole('button', { name: 'Referral Entry', exact: true }).click();

  const dateInput = getDateInput(screen.container);

  setDateValue(dateInput, '2024-06-15');

  await vi.waitFor(() => {
    expect(dateInput.value).toBe('2024-06-15');
  });

  await screen.getByPlaceholder('Enter region').fill('Region 5');

  await screen.getByRole('button', { name: 'Save', exact: true }).click();

  await vi.waitFor(() => {
    expect(inputFormService.create).toHaveBeenCalledWith(
      'referral',
      123,
      expect.objectContaining({
        FormDate: '2024-06-15',
        FormType: 'Referral Entry',
        Region: 'Region 5',
        InsertUser: 'SYSTEM',
      }),
    );
  });

  // Editor closes and history is reloaded
  await expect
    .element(screen.getByRole('heading', { name: 'Add New Referral Entry Form' }))
    .not.toBeInTheDocument();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(2);
  });
});

test('omits the region from the payload when it is empty', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Referral Entry', exact: true }).click();

  setDateValue(getDateInput(screen.container), '2024-06-15');

  await screen.getByRole('button', { name: 'Save', exact: true }).click();

  await vi.waitFor(() => {
    expect(inputFormService.create).toHaveBeenCalledTimes(1);
  });

  const payload = vi.mocked(inputFormService.create).mock.calls[0][2] as { Region?: string };

  expect(payload.Region).toBeUndefined();
});

test('shows an error when saving a new form fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(inputFormService.create).mockRejectedValue(new Error('Save failed'));

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Referral Entry', exact: true }).click();

  setDateValue(getDateInput(screen.container), '2024-06-15');

  await screen.getByRole('button', { name: 'Save', exact: true }).click();

  await expect.element(screen.getByText('Unable to save the form.')).toBeVisible();

  // Editor stays open so the user can retry
  await expect
    .element(screen.getByRole('heading', { name: 'Add New Referral Entry Form' }))
    .toBeVisible();

  expect(consoleError).toHaveBeenCalled();
});

test('opens the editor prefilled when View/Edit is clicked', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 9, formName: 'referral', formType: 'Referral Packet' }),
  ]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'View/Edit', exact: true }).click();

  await expect
    .element(screen.getByRole('heading', { name: 'View / Edit Referral Entry Form' }))
    .toBeVisible();

  await vi.waitFor(() => {
    expect(getDateInput(screen.container).value).toBe('2024-01-15');
  });

  await expect.element(screen.getByLabelText('Form Type')).toHaveValue('Referral Packet');
});

test('updates an existing form when it is saved', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 9, formName: 'referral', formType: 'Referral Packet' }),
  ]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'View/Edit', exact: true }).click();

  await screen.getByLabelText('Form Type').fill('Updated Type');

  await screen.getByRole('button', { name: 'Save', exact: true }).click();

  await vi.waitFor(() => {
    expect(inputFormService.update).toHaveBeenCalledWith(
      'referral',
      123,
      9,
      expect.objectContaining({
        FormDate: '2024-01-15',
        FormType: 'Updated Type',
        InsertUser: 'SYSTEM',
      }),
    );
  });

  expect(inputFormService.create).not.toHaveBeenCalled();
});

/* =========================================================
   ACTIVE FORM MODAL
========================================================= */

test('opens the Active form modal for a new Active form', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Active Entry', exact: true }).click();

  await expect.element(screen.getByRole('heading', { name: 'Active Form' })).toBeVisible();
  await expect.element(screen.getByText('Active page child: 123')).toBeVisible();
  await expect.element(screen.getByText('Active page form: undefined')).toBeVisible();
});

test('opens the Active form modal with the form id when editing', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 77, formName: 'active', formType: 'aop' }),
  ]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'View/Edit', exact: true }).click();

  await expect.element(screen.getByText('Active page form: 77')).toBeVisible();
});

test('closes the Active form modal when the form closes', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Active Entry', exact: true }).click();
  await screen.getByRole('button', { name: 'Close active page', exact: true }).click();

  await expect.element(screen.getByTestId('active-form-page')).not.toBeInTheDocument();
});

test('closes the Active form modal and reloads history when saved', async () => {
  const { screen } = await renderInputForms();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(1);
  });

  await screen.getByRole('button', { name: 'Active Entry', exact: true }).click();
  await screen.getByRole('button', { name: 'Save active page', exact: true }).click();

  await expect.element(screen.getByTestId('active-form-page')).not.toBeInTheDocument();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(2);
  });
});

/* =========================================================
   COS FORM MODAL
========================================================= */

test('opens the COS modal with the client and regions', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'COS Entry', exact: true }).click();

  await expect
    .element(screen.getByRole('heading', { name: 'Child Outcome Summary (COS)' }))
    .toBeVisible();

  await expect.element(screen.getByText('COS page child: 123')).toBeVisible();
  await expect.element(screen.getByText('COS page regions: 2')).toBeVisible();
  await expect.element(screen.getByText('COS page form: undefined')).toBeVisible();
});

test('opens the COS modal with the form id when editing', async () => {
  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 55, formName: 'cos-cover', formType: 'COS' }),
  ]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'View/Edit', exact: true }).click();

  await expect.element(screen.getByText('COS page form: 55')).toBeVisible();
});

test('closes the COS modal when the form closes', async () => {
  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'COS Entry', exact: true }).click();
  await screen.getByRole('button', { name: 'Close COS page', exact: true }).click();

  await expect.element(screen.getByTestId('cos-form-page')).not.toBeInTheDocument();
});

test('closes the COS modal and reloads history when saved', async () => {
  const { screen } = await renderInputForms();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(1);
  });

  await screen.getByRole('button', { name: 'COS Entry', exact: true }).click();
  await screen.getByRole('button', { name: 'Save COS page', exact: true }).click();

  await expect.element(screen.getByTestId('cos-form-page')).not.toBeInTheDocument();

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(2);
  });
});

/* =========================================================
   DELETE
========================================================= */

test('deletes a form after confirmation and reloads history', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 9, formName: 'referral', formType: 'Referral Packet' }),
  ]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Delete', exact: true }).click();

  expect(confirm).toHaveBeenCalledWith('Delete Referral Packet dated 1/15/2024?');

  await vi.waitFor(() => {
    expect(inputFormService.remove).toHaveBeenCalledWith('referral', 123, 9);
  });

  await vi.waitFor(() => {
    expect(inputFormService.getHistory).toHaveBeenCalledTimes(2);
  });
});

test('uses "Active Form" in the delete confirmation for aop forms', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

  vi.mocked(inputFormService.getHistory).mockResolvedValue([
    createItem({ id: 9, formName: 'active', formType: 'aop' }),
  ]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Delete', exact: true }).click();

  expect(confirm).toHaveBeenCalledWith('Delete Active Form dated 1/15/2024?');
});

test('does not delete when the confirmation is cancelled', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(false);

  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem({ id: 9 })]);

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Delete', exact: true }).click();

  expect(inputFormService.remove).not.toHaveBeenCalled();
  expect(inputFormService.getHistory).toHaveBeenCalledTimes(1);
});

test('shows an error when deleting a form fails', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  vi.mocked(inputFormService.getHistory).mockResolvedValue([createItem({ id: 9 })]);
  vi.mocked(inputFormService.remove).mockRejectedValue(new Error('Delete failed'));

  const { screen } = await renderInputForms();

  await screen.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect.element(screen.getByText('Unable to delete the form.')).toBeVisible();

  expect(consoleError).toHaveBeenCalled();
});
