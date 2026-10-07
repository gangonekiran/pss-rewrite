import { createRef } from 'react';

import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import clientService from '../../../../services/client.service';
import type { Client } from '../../../../types/client';

import ClientLookup, { type ClientLookupRef } from './ClientLookup';

vi.mock('../../../../services/client.service', () => ({
  default: {
    searchFirstName: vi.fn(),
    searchLastName: vi.fn(),
    searchSSN: vi.fn(),
    getById: vi.fn(),
  },
}));

/*
 * SearchableSelect is mocked because the ClientLookup tests should verify
 * ClientLookup behavior, not react-select/browser rendering.
 *
 * The mock renders a text input (typing triggers onInputChange) and one
 * button per option. Clicking a button calls onChange with that option.
 * Escape / Enter in the input report the 'menu-close' / 'set-value'
 * input actions, and a "Clear" button calls onChange(null).
 */
vi.mock('../../../../components/select/SearchableSelect', () => ({
  default: ({
    options = [],
    value,
    placeholder,
    onInputChange,
    onChange,
    isDisabled = false,
  }: {
    options?: Array<{
      value: string | number;
      label: string;
    }>;
    value?: {
      value: string | number;
      label: string;
    } | null;
    placeholder?: string;
    onInputChange?: (value: string, actionMeta: { action: string }) => void;
    onChange?: (
      option: {
        value: string | number;
        label: string;
      } | null,
    ) => void;
    isDisabled?: boolean;
  }) => (
    <div>
      <input
        placeholder={placeholder}
        disabled={isDisabled}
        value={value?.label ?? ''}
        onChange={(event) =>
          onInputChange?.(event.target.value, {
            action: 'input-change',
          })
        }
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onInputChange?.(event.currentTarget.value, { action: 'menu-close' });
          }

          if (event.key === 'Enter') {
            onInputChange?.(event.currentTarget.value, { action: 'set-value' });
          }
        }}
      />

      {value && (
        <button type="button" disabled={isDisabled} onClick={() => onChange?.(null)}>
          Clear {placeholder}
        </button>
      )}

      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          disabled={isDisabled}
          onClick={() => onChange?.(option)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

/*
 * Textbox indices (date inputs DO count as textboxes here):
 *   0 first-name lookup, 1 last-name lookup, 2 lookup DOB, 3 SSN lookup,
 *   then the detail section:
 */
const TB_LOOKUP_DOB = 2;
const TB_LAST_NAME = 4;
const TB_FIRST_NAME = 5;
const TB_SS = 6;
const TB_REGION = 7;
const TB_BIRTH_DATE = 8;

/*
 * DOM order of the arrow buttons:
 *   0 = first name
 *   1 = last name
 *   2 = DOB (always disabled)
 *   3 = SSN
 */
const ARROW_FIRST_NAME = 0;
const ARROW_LAST_NAME = 1;
const ARROW_DOB = 2;
const ARROW_SSN = 3;

const createClient = (overrides: Partial<Client> = {}): Client => ({
  childId: 123,
  region: 1,
  lastName: 'Smith',
  firstName: 'John',
  ss: '123-45-6789',
  ssTemp: false,
  dob: '2020-01-01',
  gender: 'M',
  notes: '',
  nonEarlyIntervention: false,
  ...overrides,
});

const regions = [
  {
    ID: 1,
    RName: 'Region 1',
  },
  {
    ID: 2,
    RName: 'Region 2',
  },
];

async function renderClientLookup(clientOverrides: Partial<Client> = {}, isLocked = false) {
  const client = createClient(clientOverrides);
  const setClient = vi.fn();

  const screen = await render(
    <ClientLookup client={client} setClient={setClient} isLocked={isLocked} regions={regions} />,
  );

  return {
    screen,
    client,
    setClient,
  };
}

async function clickArrow(
  screen: Awaited<ReturnType<typeof renderClientLookup>>['screen'],
  index: number,
) {
  const arrow = screen.getByRole('button', { name: '→' }).nth(index);

  await expect.element(arrow).toBeEnabled();

  // Native click: bypasses pointer simulation and any overlap in the narrow test viewport
  (arrow.element() as HTMLButtonElement).click();
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/*
 * Builds a yyyy-mm-dd date of birth whose birthday (this year) falls
 * `daysFromToday` days from today, for a person turning `years`.
 * The string is assembled from its parts so a Feb 29 birthday never rolls over.
 */
function dobWithBirthdayOn(daysFromToday: number, years: number) {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);

  return `${target.getFullYear() - years}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* =========================================================
   INITIAL RENDER
========================================================= */

test('renders client lookup fields', async () => {
  const { screen } = await renderClientLookup();

  await expect.element(screen.getByText('Lookup Client')).toBeVisible();

  await expect.element(screen.getByPlaceholder('Search First Name')).toBeVisible();

  await expect.element(screen.getByPlaceholder('Search Last Name')).toBeVisible();

  await expect.element(screen.getByPlaceholder('Search SSN')).toBeVisible();

  await expect.element(screen.getByText('Region', { exact: true })).toBeVisible();

  await expect.element(screen.getByText('Client ID')).toBeVisible();
});

test('shows a region option for each region passed in', async () => {
  const { screen } = await renderClientLookup();

  await expect.element(screen.getByRole('button', { name: 'Region 1' })).toBeVisible();

  await expect.element(screen.getByRole('button', { name: 'Region 2' })).toBeVisible();
});

/* =========================================================
   FIRST NAME SEARCH
========================================================= */

test('searches clients by first name', async () => {
  vi.mocked(clientService.searchFirstName).mockResolvedValue([
    createClient({
      childId: 101,
      firstName: 'John',
      lastName: 'Smith',
    }),
  ]);

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('John');

  await vi.waitFor(() => {
    expect(clientService.searchFirstName).toHaveBeenCalledWith('John');
  });

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).toBeVisible();
});

test('trims first name search input', async () => {
  vi.mocked(clientService.searchFirstName).mockResolvedValue([]);

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('  John  ');

  await vi.waitFor(() => {
    expect(clientService.searchFirstName).toHaveBeenCalledWith('John');
  });
});

test('clears first name results and skips the search when input is blank', async () => {
  vi.mocked(clientService.searchFirstName).mockResolvedValue([
    createClient({
      childId: 101,
      firstName: 'John',
      lastName: 'Smith',
    }),
  ]);

  const { screen } = await renderClientLookup();

  const input = screen.getByPlaceholder('Search First Name');

  await input.fill('John');

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).toBeVisible();

  // Whitespace-only input trims to empty
  await input.fill('   ');

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).not.toBeInTheDocument();

  expect(clientService.searchFirstName).toHaveBeenCalledTimes(1);
});

test('clears first name results when first name search fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(clientService.searchFirstName).mockRejectedValue(new Error('Search failed'));

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('John');

  await vi.waitFor(() => {
    expect(clientService.searchFirstName).toHaveBeenCalledWith('John');
  });

  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
  });

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).not.toBeInTheDocument();
});

/* =========================================================
   LAST NAME SEARCH
========================================================= */

test('searches clients by last name', async () => {
  vi.mocked(clientService.searchLastName).mockResolvedValue([
    createClient({
      childId: 102,
      firstName: 'John',
      lastName: 'Smith',
    }),
  ]);

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search Last Name').fill('Smith');

  await vi.waitFor(() => {
    expect(clientService.searchLastName).toHaveBeenCalledWith('Smith');
  });

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).toBeVisible();
});

test('trims last name search input', async () => {
  vi.mocked(clientService.searchLastName).mockResolvedValue([]);

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search Last Name').fill('  Smith  ');

  await vi.waitFor(() => {
    expect(clientService.searchLastName).toHaveBeenCalledWith('Smith');
  });
});

test('clears last name results and skips the search when input is blank', async () => {
  vi.mocked(clientService.searchLastName).mockResolvedValue([
    createClient({
      childId: 102,
      firstName: 'John',
      lastName: 'Smith',
    }),
  ]);

  const { screen } = await renderClientLookup();

  const input = screen.getByPlaceholder('Search Last Name');

  await input.fill('Smith');

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).toBeVisible();

  await input.fill('   ');

  await expect.element(screen.getByRole('button', { name: 'John Smith' })).not.toBeInTheDocument();

  expect(clientService.searchLastName).toHaveBeenCalledTimes(1);
});

test('clears last name results when last name search fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(clientService.searchLastName).mockRejectedValue(new Error('Search failed'));

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search Last Name').fill('Smith');

  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
  });
});

/* =========================================================
   SSN SEARCH
========================================================= */

test('searches clients by SSN', async () => {
  vi.mocked(clientService.searchSSN).mockResolvedValue([
    createClient({
      childId: 103,
      ss: '111-22-3333',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
  ]);

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search SSN').fill('111-22');

  await vi.waitFor(() => {
    expect(clientService.searchSSN).toHaveBeenCalledWith('111-22');
  });

  await expect.element(screen.getByRole('button', { name: '111-22-3333' })).toBeVisible();
});

test('trims SSN search input', async () => {
  vi.mocked(clientService.searchSSN).mockResolvedValue([]);

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search SSN').fill(' 111-22 ');

  await vi.waitFor(() => {
    expect(clientService.searchSSN).toHaveBeenCalledWith('111-22');
  });
});

test('clears SSN results and skips the search when input is blank', async () => {
  vi.mocked(clientService.searchSSN).mockResolvedValue([
    createClient({
      childId: 103,
      ss: '111-22-3333',
    }),
  ]);

  const { screen } = await renderClientLookup();

  const input = screen.getByPlaceholder('Search SSN');

  await input.fill('111-22');

  await expect.element(screen.getByRole('button', { name: '111-22-3333' })).toBeVisible();

  await input.fill('   ');

  await expect.element(screen.getByRole('button', { name: '111-22-3333' })).not.toBeInTheDocument();

  expect(clientService.searchSSN).toHaveBeenCalledTimes(1);
});

test('clears SSN results when SSN search fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(clientService.searchSSN).mockRejectedValue(new Error('Search failed'));

  const { screen } = await renderClientLookup();

  await screen.getByPlaceholder('Search SSN').fill('111-22');

  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
  });
});

/* =========================================================
   LOAD CLIENT
========================================================= */

test('arrow buttons are disabled until a result is selected', async () => {
  const { screen } = await renderClientLookup();

  const arrows = screen.getByRole('button', { name: '→' });

  await expect.element(arrows.nth(ARROW_FIRST_NAME)).toBeDisabled();
  await expect.element(arrows.nth(ARROW_LAST_NAME)).toBeDisabled();
  await expect.element(arrows.nth(ARROW_DOB)).toBeDisabled();
  await expect.element(arrows.nth(ARROW_SSN)).toBeDisabled();
});

test('loads client when first name result is selected and arrow is clicked', async () => {
  const consoleError = vi.spyOn(console, 'error');

  const selectedClient = createClient({
    childId: 101,
    firstName: 'Jane',
    lastName: 'Doe',
    ss: '111-22-3333',
  });

  vi.mocked(clientService.searchFirstName).mockResolvedValue([selectedClient]);
  vi.mocked(clientService.getById).mockResolvedValue(selectedClient);

  const { screen, setClient } = await renderClientLookup();

  const firstNameInput = screen.getByPlaceholder('Search First Name');
  await firstNameInput.fill('Jane');

  await screen.getByRole('button', { name: 'Jane Doe' }).click();

  // Did the selection register?
  await expect.element(firstNameInput).toHaveValue('Jane Doe');

  await clickArrow(screen, ARROW_FIRST_NAME);

  await vi.waitFor(() => {
    expect(clientService.getById).toHaveBeenCalledWith(101);
  });

  await vi.waitFor(() => {
    expect(setClient).toHaveBeenCalledWith(selectedClient);
  });

  expect(consoleError).not.toHaveBeenCalled();
});

test('loads client when last name result is selected and arrow is clicked', async () => {
  const selectedClient = createClient({
    childId: 102,
    firstName: 'Jane',
    lastName: 'Smith',
  });

  vi.mocked(clientService.searchLastName).mockResolvedValue([selectedClient]);
  vi.mocked(clientService.getById).mockResolvedValue(selectedClient);

  const { screen, setClient } = await renderClientLookup();

  const input = screen.getByPlaceholder('Search Last Name');
  await input.fill('Smith');

  await screen.getByRole('button', { name: 'Jane Smith' }).click();

  await expect.element(input).toHaveValue('Jane Smith');

  await clickArrow(screen, ARROW_LAST_NAME);

  await vi.waitFor(() => {
    expect(clientService.getById).toHaveBeenCalledWith(102);
  });

  await vi.waitFor(() => {
    expect(setClient).toHaveBeenCalledWith(selectedClient);
  });
});

test('loads client when SSN result is selected and arrow is clicked', async () => {
  const selectedClient = createClient({
    childId: 103,
    firstName: 'Jane',
    lastName: 'Doe',
    ss: '111-22-3333',
  });

  vi.mocked(clientService.searchSSN).mockResolvedValue([selectedClient]);
  vi.mocked(clientService.getById).mockResolvedValue(selectedClient);

  const { screen, setClient } = await renderClientLookup();

  const input = screen.getByPlaceholder('Search SSN');
  await input.fill('111-22');

  await screen.getByRole('button', { name: '111-22-3333' }).click();

  await expect.element(input).toHaveValue('111-22-3333');

  await clickArrow(screen, ARROW_SSN);

  await vi.waitFor(() => {
    expect(clientService.getById).toHaveBeenCalledWith(103);
  });

  await vi.waitFor(() => {
    expect(setClient).toHaveBeenCalledWith(selectedClient);
  });
});

test('populates all three lookup inputs after a client is loaded', async () => {
  const selectedClient = createClient({
    childId: 101,
    firstName: 'Jane',
    lastName: 'Doe',
    ss: '111-22-3333',
  });

  vi.mocked(clientService.searchFirstName).mockResolvedValue([selectedClient]);
  vi.mocked(clientService.getById).mockResolvedValue(selectedClient);

  const { screen } = await renderClientLookup();

  const firstNameInput = screen.getByPlaceholder('Search First Name');

  await firstNameInput.fill('Jane');
  await screen.getByRole('button', { name: 'Jane Doe' }).click();
  await expect.element(firstNameInput).toHaveValue('Jane Doe');

  await clickArrow(screen, ARROW_FIRST_NAME);

  await vi.waitFor(() => {
    expect(clientService.getById).toHaveBeenCalledWith(101);
  });

  await expect.element(screen.getByPlaceholder('Search First Name')).toHaveValue('Jane Doe');
  await expect.element(screen.getByPlaceholder('Search Last Name')).toHaveValue('Jane Doe');
  await expect.element(screen.getByPlaceholder('Search SSN')).toHaveValue('111-22-3333');
});

/* =========================================================
   CLIENT DETAILS
========================================================= */

test('displays client information', async () => {
  const { screen } = await renderClientLookup();

  await expect.element(screen.getByText('123', { exact: true })).toBeVisible();

  await expect.element(screen.getByText('Age:')).toBeVisible();
});

test('shows "New" as client ID when client has no childId', async () => {
  const { screen } = await renderClientLookup({ childId: undefined });

  await expect.element(screen.getByText('New', { exact: true })).toBeVisible();
});

test('shows placeholder age when there is no DOB', async () => {
  const { screen } = await renderClientLookup({ dob: undefined });

  await expect.element(screen.getByText('--', { exact: true })).toBeVisible();
});

test('shows the full age on the birthday', async () => {
  const { screen } = await renderClientLookup({ dob: dobWithBirthdayOn(0, 6) });

  await expect.element(screen.getByText('6', { exact: true })).toBeVisible();
});

test('shows one year less the day before the birthday', async () => {
  const { screen } = await renderClientLookup({ dob: dobWithBirthdayOn(1, 6) });

  await expect.element(screen.getByText('5', { exact: true })).toBeVisible();
});

test('shows a date-time DOB in both date inputs without the time part', async () => {
  const { screen } = await renderClientLookup({ dob: '2020-05-23T00:00:00' });

  const textboxes = screen.getByRole('textbox');

  await expect.element(textboxes.nth(TB_LOOKUP_DOB)).toHaveValue('2020-05-23');
  await expect.element(textboxes.nth(TB_BIRTH_DATE)).toHaveValue('2020-05-23');
});

test('shows the selected region of the client', async () => {
  const { screen } = await renderClientLookup({ region: 1 });

  await expect.element(screen.getByRole('textbox').nth(TB_REGION)).toHaveValue('Region 1');
});

test('disables client fields when locked', async () => {
  const { screen } = await renderClientLookup({}, true);

  const textboxes = screen.getByRole('textbox');

  await expect.element(textboxes.nth(TB_LAST_NAME)).toBeDisabled();
  await expect.element(textboxes.nth(TB_FIRST_NAME)).toBeDisabled();
  await expect.element(textboxes.nth(TB_SS)).toBeDisabled();
  await expect.element(textboxes.nth(TB_REGION)).toBeDisabled();
  await expect.element(textboxes.nth(TB_BIRTH_DATE)).toBeDisabled();

  // The only native combobox is Gender (SearchableSelect is mocked)
  await expect.element(screen.getByRole('combobox')).toBeDisabled();

  await expect.element(screen.getByLabelText('Non-EI')).toBeDisabled();
});

test('keeps the lookup DOB search enabled when locked', async () => {
  const { screen } = await renderClientLookup({ dob: '2020-01-01' }, true);

  await expect.element(screen.getByRole('textbox').nth(TB_LOOKUP_DOB)).not.toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Clear DOB' })).toBeInTheDocument();
});

test('allows editing client fields when unlocked', async () => {
  const { screen } = await renderClientLookup({}, false);

  const textboxes = screen.getByRole('textbox');

  await expect.element(textboxes.nth(TB_LOOKUP_DOB)).not.toBeDisabled();
  await expect.element(textboxes.nth(TB_LAST_NAME)).not.toBeDisabled();
  await expect.element(textboxes.nth(TB_FIRST_NAME)).not.toBeDisabled();
  await expect.element(textboxes.nth(TB_SS)).not.toBeDisabled();
  await expect.element(textboxes.nth(TB_REGION)).not.toBeDisabled();
  await expect.element(textboxes.nth(TB_BIRTH_DATE)).not.toBeDisabled();

  await expect.element(screen.getByRole('combobox')).not.toBeDisabled();
  await expect.element(screen.getByLabelText('Non-EI')).not.toBeDisabled();
});

test('updates last name, first name and SS# when edited', async () => {
  const { screen, setClient } = await renderClientLookup();

  const textboxes = screen.getByRole('textbox');

  await textboxes.nth(TB_LAST_NAME).fill('Jones');
  expect(setClient).toHaveBeenCalledWith(expect.objectContaining({ lastName: 'Jones' }));

  await textboxes.nth(TB_FIRST_NAME).fill('Mary');
  expect(setClient).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Mary' }));

  await textboxes.nth(TB_SS).fill('111-22-333');
  expect(setClient).toHaveBeenCalledWith(expect.objectContaining({ ss: '111-22-333' }));
});

test('updates gender when a gender is selected', async () => {
  const { screen, setClient } = await renderClientLookup({ gender: 'M' });

  await screen.getByRole('combobox').selectOptions('F');

  expect(setClient).toHaveBeenCalledWith(expect.objectContaining({ gender: 'F' }));
});

/* =========================================================
   REGION
========================================================= */

test('updates region when a region is selected', async () => {
  const { screen, setClient } = await renderClientLookup();

  await screen.getByRole('button', { name: 'Region 2' }).click();

  expect(setClient).toHaveBeenCalledWith(
    expect.objectContaining({
      region: 2,
    }),
  );
});

/* =========================================================
   DOB
========================================================= */

test('updates DOB when birth date changes', async () => {
  const { screen, setClient } = await renderClientLookup();

  const birthDate = screen.getByRole('textbox').nth(TB_BIRTH_DATE);

  await birthDate.fill('2021-05-15');

  expect(setClient).toHaveBeenCalledWith(
    expect.objectContaining({
      dob: '2021-05-15',
    }),
  );
});

test('updates DOB when the lookup DOB changes', async () => {
  const { screen, setClient } = await renderClientLookup();

  await screen.getByRole('textbox').nth(TB_LOOKUP_DOB).fill('2019-03-04');

  expect(setClient).toHaveBeenCalledWith(
    expect.objectContaining({
      dob: '2019-03-04',
    }),
  );
});

test('clears DOB when Clear DOB is clicked', async () => {
  const { screen, setClient } = await renderClientLookup({
    dob: '2020-01-01',
  });

  await screen.getByRole('button', { name: 'Clear DOB' }).click();

  expect(setClient).toHaveBeenCalledWith(
    expect.objectContaining({
      dob: undefined,
    }),
  );
});

test('does not show Clear DOB when there is no DOB', async () => {
  const { screen } = await renderClientLookup({ dob: undefined });

  await expect.element(screen.getByRole('button', { name: 'Clear DOB' })).not.toBeInTheDocument();
});

/* =========================================================
   NON-EI
========================================================= */

test('updates Non-EI when checkbox is changed', async () => {
  const { screen, setClient } = await renderClientLookup({
    nonEarlyIntervention: false,
  });

  const checkbox = screen.getByLabelText('Non-EI');
  await expect.element(checkbox).not.toBeChecked();

  (checkbox.element() as HTMLInputElement).click();

  await vi.waitFor(() => {
    expect(setClient).toHaveBeenCalledWith(expect.objectContaining({ nonEarlyIntervention: true }));
  });
});

/* =========================================================
   IMPERATIVE REF
========================================================= */

test('clearLookup clears lookup selections and search results', async () => {
  const selectedClient = createClient({
    childId: 101,
    firstName: 'Jane',
    lastName: 'Doe',
    ss: '111-22-3333',
  });

  vi.mocked(clientService.searchFirstName).mockResolvedValue([selectedClient]);

  const ref = createRef<ClientLookupRef>();

  const screen = await render(
    <ClientLookup
      client={createClient()}
      setClient={vi.fn()}
      isLocked={false}
      regions={regions}
      ref={ref}
    />,
  );

  const firstNameInput = screen.getByPlaceholder('Search First Name');

  await firstNameInput.fill('Jane');

  // Select the result so the input shows the selected label
  await screen.getByRole('button', { name: 'Jane Doe' }).click();

  await expect.element(firstNameInput).toHaveValue('Jane Doe');

  expect(ref.current).not.toBeNull();

  // No act(): browser mode does not set up React's act environment.
  // The assertions below retry until the state update has rendered.
  ref.current?.clearLookup();

  await expect.element(firstNameInput).toHaveValue('');
  await expect.element(screen.getByPlaceholder('Search Last Name')).toHaveValue('');
  await expect.element(screen.getByPlaceholder('Search SSN')).toHaveValue('');
  await expect.element(screen.getByRole('button', { name: 'Jane Doe' })).not.toBeInTheDocument();
});

/* =========================================================
   ERROR HANDLING
========================================================= */

test('handles client loading failure', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.mocked(clientService.searchFirstName).mockResolvedValue([
    createClient({ childId: 123, firstName: 'John', lastName: 'Smith' }),
  ]);
  vi.mocked(clientService.getById).mockRejectedValue(new Error('Client loading failed'));

  const { screen, setClient } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('John');
  await screen.getByRole('button', { name: 'John Smith' }).click();

  await clickArrow(screen, ARROW_FIRST_NAME);

  await vi.waitFor(() => {
    expect(clientService.getById).toHaveBeenCalledWith(123);
  });

  await vi.waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
  });

  expect(setClient).not.toHaveBeenCalled();
});

test('does not load a client when the selected result has no client ID', async () => {
  vi.mocked(clientService.searchFirstName).mockResolvedValue([
    createClient({ childId: 0, firstName: 'John', lastName: 'Smith' }),
  ]);

  const { screen, setClient } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('John');
  await screen.getByRole('button', { name: 'John Smith' }).click();

  await clickArrow(screen, ARROW_FIRST_NAME);

  await expect.element(screen.getByText('Loading...')).not.toBeInTheDocument();

  expect(clientService.getById).not.toHaveBeenCalled();
  expect(setClient).not.toHaveBeenCalled();
});

/* =========================================================
   SEARCH INPUT ACTIONS
========================================================= */

function pressKey(input: Element, key: string) {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

test('searches again with the input text when a lookup menu closes', async () => {
  vi.mocked(clientService.searchFirstName).mockResolvedValue([
    createClient({ childId: 101, firstName: 'Jane', lastName: 'Doe' }),
  ]);
  vi.mocked(clientService.searchLastName).mockResolvedValue([
    createClient({ childId: 102, firstName: 'Jane', lastName: 'Smith' }),
  ]);
  vi.mocked(clientService.searchSSN).mockResolvedValue([
    createClient({ childId: 103, ss: '111-22-3333' }),
  ]);

  const { screen } = await renderClientLookup();

  const firstNameInput = screen.getByPlaceholder('Search First Name');
  const lastNameInput = screen.getByPlaceholder('Search Last Name');
  const ssnInput = screen.getByPlaceholder('Search SSN');

  await firstNameInput.fill('Jane');
  await screen.getByRole('button', { name: 'Jane Doe' }).click();
  await lastNameInput.fill('Smith');
  await screen.getByRole('button', { name: 'Jane Smith' }).click();
  await ssnInput.fill('111');
  await screen.getByRole('button', { name: '111-22-3333' }).click();

  pressKey(firstNameInput.element(), 'Escape');
  pressKey(lastNameInput.element(), 'Escape');
  pressKey(ssnInput.element(), 'Escape');

  await vi.waitFor(() => {
    expect(clientService.searchFirstName).toHaveBeenLastCalledWith('Jane Doe');
    expect(clientService.searchLastName).toHaveBeenLastCalledWith('Jane Smith');
    expect(clientService.searchSSN).toHaveBeenLastCalledWith('111-22-3333');
  });
});

test('ignores lookup input actions other than typing and menu close', async () => {
  const { screen } = await renderClientLookup();

  pressKey(screen.getByPlaceholder('Search First Name').element(), 'Enter');
  pressKey(screen.getByPlaceholder('Search Last Name').element(), 'Enter');
  pressKey(screen.getByPlaceholder('Search SSN').element(), 'Enter');

  expect(clientService.searchFirstName).not.toHaveBeenCalled();
  expect(clientService.searchLastName).not.toHaveBeenCalled();
  expect(clientService.searchSSN).not.toHaveBeenCalled();
});

/* =========================================================
   MISSING VALUES
========================================================= */

test('builds lookup labels from blank values when names and SSN are missing', async () => {
  const nameless = createClient({
    childId: 104,
    firstName: undefined,
    lastName: undefined,
    ss: undefined,
  });

  vi.mocked(clientService.searchFirstName).mockResolvedValue([{ ...nameless, firstName: 'Ann' }]);
  vi.mocked(clientService.searchLastName).mockResolvedValue([{ ...nameless, lastName: 'Lee' }]);
  vi.mocked(clientService.searchSSN).mockResolvedValue([nameless]);
  vi.mocked(clientService.getById).mockResolvedValue(nameless);

  const { screen, setClient } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('Ann');
  await screen.getByPlaceholder('Search Last Name').fill('Lee');
  await screen.getByPlaceholder('Search SSN').fill('1');

  // Labels are trimmed when one name part is missing
  await expect.element(screen.getByRole('button', { name: 'Ann', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Lee', exact: true })).toBeVisible();

  await vi.waitFor(() => {
    expect(clientService.searchSSN).toHaveBeenCalledWith('1');
  });

  await screen.getByRole('button', { name: 'Ann', exact: true }).click();
  await clickArrow(screen, ARROW_FIRST_NAME);

  await vi.waitFor(() => {
    expect(setClient).toHaveBeenCalledWith(nameless);
  });

  // The loaded client has no names or SSN, so every lookup shows blank
  await expect.element(screen.getByPlaceholder('Search First Name')).toHaveValue('');
  await expect.element(screen.getByPlaceholder('Search Last Name')).toHaveValue('');
  await expect.element(screen.getByPlaceholder('Search SSN')).toHaveValue('');
});

test('does not load a client when the selected result has a non-numeric ID', async () => {
  const noId = createClient({ childId: undefined, firstName: 'Jane', lastName: 'Doe' });

  vi.mocked(clientService.searchFirstName).mockResolvedValue([noId]);
  vi.mocked(clientService.searchLastName).mockResolvedValue([noId]);
  vi.mocked(clientService.searchSSN).mockResolvedValue([noId]);

  const { screen, setClient } = await renderClientLookup();

  await screen.getByPlaceholder('Search First Name').fill('Jane');
  await screen.getByRole('button', { name: 'Jane Doe' }).first().click();
  await clickArrow(screen, ARROW_FIRST_NAME);

  await screen.getByPlaceholder('Search Last Name').fill('Doe');
  await screen.getByRole('button', { name: 'Jane Doe' }).nth(1).click();
  await clickArrow(screen, ARROW_LAST_NAME);

  await screen.getByPlaceholder('Search SSN').fill('123');
  await screen.getByRole('button', { name: '123-45-6789' }).click();
  await clickArrow(screen, ARROW_SSN);

  expect(clientService.getById).not.toHaveBeenCalled();
  expect(setClient).not.toHaveBeenCalled();
});

test('shows empty detail fields when optional client values are missing', async () => {
  const { screen } = await renderClientLookup({
    gender: undefined,
    ss: undefined,
    region: undefined,
    nonEarlyIntervention: undefined,
  });

  const textboxes = screen.getByRole('textbox');

  await expect.element(screen.getByRole('combobox')).toHaveValue('');
  await expect.element(textboxes.nth(TB_SS)).toHaveValue('');
  await expect.element(textboxes.nth(TB_REGION)).toHaveValue('');
  await expect.element(screen.getByRole('checkbox')).not.toBeChecked();
});

test('shows no region when the client region is not in the list', async () => {
  const { screen } = await renderClientLookup({ region: 99 });

  await expect.element(screen.getByRole('textbox').nth(TB_REGION)).toHaveValue('');
});

test('clears the region when the region selection is cleared', async () => {
  const { screen, client, setClient } = await renderClientLookup({ region: 1 });

  await screen.getByRole('button', { name: 'Clear Select Region' }).click();

  expect(setClient).toHaveBeenCalledWith({ ...client, region: undefined });
});

test('shows placeholder age when the DOB is malformed', async () => {
  const { screen } = await renderClientLookup({ dob: 'not-a-date' });

  await expect.element(screen.getByText('--', { exact: true })).toBeVisible();
});
