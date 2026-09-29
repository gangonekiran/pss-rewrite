import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { test } from '../../../../../test-extend';

import clientService from '../../../../services/client.service';
import type { Client } from '../../../../types/client';

import ClientActions from './ClientActions';

vi.mock('../../../../services/client.service', () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

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

async function renderClientActions(
  overrides: Partial<Client> = {},
  isLocked = false,
) {
  const client = createClient(overrides);

  const setClient = vi.fn();
  const setIsNewClient = vi.fn();
  const setIsLocked = vi.fn();
  const clearClientLookup = vi.fn();
  const clearClient = vi.fn();

  const screen = await render(
    <ClientActions
      client={client}
      setClient={setClient}
      isNewClient={!client.childId}
      setIsNewClient={setIsNewClient}
      clearClientLookup={clearClientLookup}
      isLocked={isLocked}
      setIsLocked={setIsLocked}
      clearClient={clearClient}
    />,
  );

  return {
    screen,
    client,
    setClient,
    setIsNewClient,
    setIsLocked,
    clearClientLookup,
    clearClient,
  };
}

/* =========================================================
   RENDERING
========================================================= */

test('renders all client action buttons', async () => {
  const { screen } = await renderClientActions();

  await expect
    .element(screen.getByRole('button', { name: 'Lock' }))
    .toBeVisible();

  await expect
    .element(screen.getByRole('button', { name: 'Delete Client' }))
    .toBeVisible();

  await expect
    .element(screen.getByRole('button', { name: 'Add New Client' }))
    .toBeVisible();

  await expect
    .element(screen.getByRole('button', { name: 'Done' }))
    .toBeVisible();
});

/* =========================================================
   LOCK / UNLOCK
========================================================= */

test('locks the client when Lock is clicked', async () => {
  const { screen, setIsLocked } = await renderClientActions();

  await screen.getByRole('button', { name: 'Lock' }).click();

  expect(setIsLocked).toHaveBeenCalledTimes(1);
  expect(setIsLocked).toHaveBeenCalledWith(expect.any(Function));
});

test('shows Unlock when client is locked', async () => {
  const { screen } = await renderClientActions({}, true);

  await expect
    .element(screen.getByRole('button', { name: 'Unlock' }))
    .toBeVisible();
});

test('unlocks the client when Unlock is clicked', async () => {
  const { screen, setIsLocked } = await renderClientActions({}, true);

  await screen.getByRole('button', { name: 'Unlock' }).click();

  expect(setIsLocked).toHaveBeenCalledTimes(1);
  expect(setIsLocked).toHaveBeenCalledWith(expect.any(Function));
});

/* =========================================================
   UPDATE EXISTING CLIENT
========================================================= */

test('updates an existing client successfully', async () => {
  const client = createClient({
    childId: 123,
  });

  const updatedClient = createClient({
    childId: 123,
    firstName: 'Updated',
    lastName: 'Smith',
  });

  vi.mocked(clientService.update).mockResolvedValue(updatedClient);

  const setClient = vi.fn();
  const setIsNewClient = vi.fn();
  const setIsLocked = vi.fn();
  const clearClientLookup = vi.fn();
  const clearClient = vi.fn();

  const screen = await render(
    <ClientActions
      client={client}
      setClient={setClient}
      isNewClient={false}
      setIsNewClient={setIsNewClient}
      clearClientLookup={clearClientLookup}
      isLocked={false}
      setIsLocked={setIsLocked}
      clearClient={clearClient}
    />,
  );

  await screen.getByRole('button', { name: 'Done' }).click();

  await vi.waitFor(() => {
    expect(clientService.update).toHaveBeenCalledTimes(1);
  });

  expect(clientService.update).toHaveBeenCalledWith(
    123,
    client,
  );

  expect(setClient).toHaveBeenCalledWith(updatedClient);
  expect(setIsNewClient).toHaveBeenCalledWith(false);
  expect(setIsLocked).toHaveBeenCalledWith(true);
  expect(clearClientLookup).toHaveBeenCalledTimes(1);
});

/* =========================================================
   CREATE NEW CLIENT
========================================================= */

test('creates a new client successfully', async () => {
  const client = createClient({
    childId: undefined,
    firstName: 'John',
    lastName: 'Smith',
  });

  const createdClient = createClient({
    childId: 456,
    firstName: 'John',
    lastName: 'Smith',
  });

  vi.mocked(clientService.create).mockResolvedValue(createdClient);

  const setClient = vi.fn();
  const setIsNewClient = vi.fn();
  const setIsLocked = vi.fn();
  const clearClientLookup = vi.fn();
  const clearClient = vi.fn();
  const screen = await render(
    <ClientActions
      client={client}
      setClient={setClient}
      isNewClient
      setIsNewClient={setIsNewClient}
      clearClientLookup={clearClientLookup}
      clearClient={clearClient}
      isLocked={false}
      setIsLocked={setIsLocked}
    />,
  );

  await screen.getByRole('button', { name: 'Done' }).click();

  await vi.waitFor(() => {
    expect(clientService.create).toHaveBeenCalledTimes(1);
  });

  expect(clientService.create).toHaveBeenCalledWith(client);
  expect(setClient).toHaveBeenCalledWith(createdClient);
  expect(setIsNewClient).toHaveBeenCalledWith(false);
  expect(setIsLocked).toHaveBeenCalledWith(true);
  expect(clearClientLookup).toHaveBeenCalledTimes(1);
});

/* =========================================================
   SAVE VALIDATION
========================================================= */

test('does not save when last name is missing', async () => {
  const { screen } = await renderClientActions({
    lastName: '',
  });

  await screen.getByRole('button', { name: 'Done' }).click();

  expect(clientService.update).not.toHaveBeenCalled();
  expect(clientService.create).not.toHaveBeenCalled();
});

test('does not save when last name contains only spaces', async () => {
  const { screen } = await renderClientActions({
    lastName: '   ',
  });

  await screen.getByRole('button', { name: 'Done' }).click();

  expect(clientService.update).not.toHaveBeenCalled();
  expect(clientService.create).not.toHaveBeenCalled();
});

test('does not save when first name is missing', async () => {
  const { screen } = await renderClientActions({
    firstName: '',
  });

  await screen.getByRole('button', { name: 'Done' }).click();

  expect(clientService.update).not.toHaveBeenCalled();
  expect(clientService.create).not.toHaveBeenCalled();
});

test('does not save when first name contains only spaces', async () => {
  const { screen } = await renderClientActions({
    firstName: '   ',
  });

  await screen.getByRole('button', { name: 'Done' }).click();

  expect(clientService.update).not.toHaveBeenCalled();
  expect(clientService.create).not.toHaveBeenCalled();
});

/* =========================================================
   LOCKED SAVE
========================================================= */

test('does not save a locked client', async () => {
  const { screen } = await renderClientActions({}, true);

  await expect
    .element(screen.getByRole('button', { name: 'Done' }))
    .toBeDisabled();

  expect(clientService.update).not.toHaveBeenCalled();
  expect(clientService.create).not.toHaveBeenCalled();
});

/* =========================================================
   SAVE ERROR
========================================================= */

test('handles update failure', async () => {
  vi.mocked(clientService.update).mockRejectedValue(
    new Error('Save failed'),
  );

  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  const {
    screen,
    setClient,
    setIsNewClient,
    setIsLocked,
  } = await renderClientActions();

  await screen.getByRole('button', { name: 'Done' }).click();

  await vi.waitFor(() => {
    expect(clientService.update).toHaveBeenCalledTimes(1);
  });

  expect(setClient).not.toHaveBeenCalled();
  expect(setIsNewClient).not.toHaveBeenCalled();
  expect(setIsLocked).not.toHaveBeenCalled();

  consoleError.mockRestore();
});

test('handles create failure', async () => {
  vi.mocked(clientService.create).mockRejectedValue(
    new Error('Create failed'),
  );

  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  const {
    screen,
    setClient,
    setIsNewClient,
    setIsLocked,
  } = await renderClientActions({
    childId: undefined,
  });

  await screen.getByRole('button', { name: 'Done' }).click();

  await vi.waitFor(() => {
    expect(clientService.create).toHaveBeenCalledTimes(1);
  });

  expect(setClient).not.toHaveBeenCalled();
  expect(setIsNewClient).not.toHaveBeenCalled();
  expect(setIsLocked).not.toHaveBeenCalled();

  consoleError.mockRestore();
});

/* =========================================================
   DELETE
========================================================= */

test('deletes an existing client after confirmation', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  vi.mocked(clientService.delete).mockResolvedValue(undefined);

  const {
    screen,
    setClient,
    setIsNewClient,
    setIsLocked,
  } = await renderClientActions();

  await screen.getByRole('button', { name: 'Delete Client' }).click();

  await vi.waitFor(() => {
    expect(clientService.delete).toHaveBeenCalledTimes(1);
  });

  expect(clientService.delete).toHaveBeenCalledWith(123);

  expect(setClient).toHaveBeenCalledTimes(1);

  expect(setClient).toHaveBeenCalledWith(
    expect.objectContaining({
      childId: undefined,
      region: 0,
      lastName: '',
      firstName: '',
      ss: '',
      ssTemp: false,
      dob: '',
      gender: '',
      notes: '',
      nonEarlyIntervention: false,
    }),
  );

  expect(setIsNewClient).toHaveBeenCalledWith(true);
  expect(setIsLocked).toHaveBeenCalledWith(true);
});

test('does not delete when confirmation is cancelled', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);

  const {
    screen,
    setClient,
    setIsNewClient,
    setIsLocked,
  } = await renderClientActions();

  await screen.getByRole('button', { name: 'Delete Client' }).click();

  expect(clientService.delete).not.toHaveBeenCalled();
  expect(setClient).not.toHaveBeenCalled();
  expect(setIsNewClient).not.toHaveBeenCalled();
  expect(setIsLocked).not.toHaveBeenCalled();
});

test('delete button is disabled when there is no client id', async () => {
  const { screen } = await renderClientActions({
    childId: undefined,
  });

  await expect
    .element(screen.getByRole('button', { name: 'Delete Client' }))
    .toBeDisabled();
});

test('delete button is disabled when client is locked', async () => {
  const { screen } = await renderClientActions({}, true);

  await expect
    .element(screen.getByRole('button', { name: 'Delete Client' }))
    .toBeDisabled();
});

test('does not delete a locked client', async () => {
  const { screen } = await renderClientActions({}, true);

  await expect
    .element(screen.getByRole('button', { name: 'Delete Client' }))
    .toBeDisabled();

  expect(clientService.delete).not.toHaveBeenCalled();
});

/* =========================================================
   DELETE ERROR
========================================================= */

test('handles delete failure', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  vi.mocked(clientService.delete).mockRejectedValue(
    new Error('Delete failed'),
  );

  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  const {
    screen,
    setClient,
    setIsNewClient,
    setIsLocked,
  } = await renderClientActions();

  await screen.getByRole('button', { name: 'Delete Client' }).click();

  await vi.waitFor(() => {
    expect(clientService.delete).toHaveBeenCalledTimes(1);
  });

  expect(setClient).not.toHaveBeenCalled();
  expect(setIsNewClient).not.toHaveBeenCalled();
  expect(setIsLocked).not.toHaveBeenCalled();

  consoleError.mockRestore();
});

/* =========================================================
   ADD NEW CLIENT
========================================================= */

test('adds a new client and clears the lookup', async () => {
  const {
    screen,
    setClient,
    setIsLocked,
    clearClientLookup,
  } = await renderClientActions();

  await screen
    .getByRole('button', { name: 'Add New Client' })
    .click();

  expect(setClient).toHaveBeenCalledTimes(1);

  expect(setClient).toHaveBeenCalledWith(
    expect.objectContaining({
      childId: undefined,
      region: 0,
      lastName: '',
      firstName: '',
      ss: '',
      ssTemp: false,
      dob: '',
      gender: '',
      notes: '',
      nonEarlyIntervention: false,
    }),
  );

  expect(setIsLocked).toHaveBeenCalledWith(false);
  expect(clearClientLookup).toHaveBeenCalledTimes(1);
});