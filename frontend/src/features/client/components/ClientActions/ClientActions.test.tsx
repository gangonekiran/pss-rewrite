import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ClientActions from './ClientActions';
import clientService from '../../../../services/client.service';
import type { Client } from '../../../../types/client';
import toast from 'react-hot-toast';

vi.mock('../../../../services/client.service', () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const emptyClient: Client = {
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
};

const existingClient: Client = {
  childId: 123,
  region: 1,
  lastName: 'Smith',
  firstName: 'John',
  ss: '123-45-6789',
  ssTemp: false,
  dob: '2020-01-15',
  gender: 'M',
  notes: '',
  nonEarlyIntervention: false,
};

function renderClientActions(client: Client = existingClient, isLocked = false) {
  const setClient = vi.fn();
  const setIsNewClient = vi.fn();
  const setIsLocked = vi.fn();
  const clearClient = vi.fn();
  const clearClientLookup = vi.fn();

  render(
    <ClientActions
      isNewClient={!client.childId}
      client={client}
      setClient={setClient}
      setIsNewClient={setIsNewClient}
      clearClient={clearClient}
      isLocked={isLocked}
      setIsLocked={setIsLocked}
      clearClientLookup={clearClientLookup}
    />,
  );

  return {
    setClient,
    setIsNewClient,
    setIsLocked,
    clearClient,
    clearClientLookup,
  };
}

describe('ClientActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Save / Update Client', () => {
    it('should update an existing client', async () => {
      const savedClient: Client = {
        ...existingClient,
        firstName: 'Updated',
      };

      vi.mocked(clientService.update).mockResolvedValue(savedClient);

      const { setClient, setIsNewClient, setIsLocked, clearClientLookup } = renderClientActions();

      fireEvent.click(screen.getByRole('button', { name: 'Done' }));

      await waitFor(() => {
        expect(clientService.update).toHaveBeenCalledWith(123, existingClient);
      });

      expect(clearClientLookup).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Client updated successfully');
      expect(setClient).toHaveBeenCalledWith(savedClient);
      expect(setIsNewClient).toHaveBeenCalledWith(false);
      expect(setIsLocked).toHaveBeenCalledWith(true);
    });

    it('should create a new client when childId is not present', async () => {
      const newClient: Client = {
        ...emptyClient,
        lastName: 'Smith',
        firstName: 'John',
      };

      const savedClient: Client = {
        ...newClient,
        childId: 456,
      };

      vi.mocked(clientService.create).mockResolvedValue(savedClient);

      const { setClient, setIsNewClient, setIsLocked, clearClientLookup } = renderClientActions(
        newClient,
        false,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Done' }));

      await waitFor(() => {
        expect(clientService.create).toHaveBeenCalledWith(newClient);
      });

      expect(clearClientLookup).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Client created successfully');
      expect(setClient).toHaveBeenCalledWith(savedClient);
      expect(setIsNewClient).toHaveBeenCalledWith(false);
      expect(setIsLocked).toHaveBeenCalledWith(true);
    });

    it('should not save when client is locked', async () => {
      renderClientActions(existingClient, true);

      const doneButton = screen.getByRole('button', { name: 'Done' });

      expect(doneButton).toBeDisabled();

      fireEvent.click(doneButton);

      expect(clientService.update).not.toHaveBeenCalled();
      expect(clientService.create).not.toHaveBeenCalled();
    });

    it('should show an error when last name is missing', async () => {
      const client = {
        ...existingClient,
        lastName: '',
      };

      renderClientActions(client, false);

      fireEvent.click(screen.getByRole('button', { name: 'Done' }));

      expect(toast.error).toHaveBeenCalledWith('Last Name is required.');

      expect(clientService.update).not.toHaveBeenCalled();
      expect(clientService.create).not.toHaveBeenCalled();
    });

    it('should show an error when first name is missing', async () => {
      const client = {
        ...existingClient,
        firstName: '',
      };

      renderClientActions(client, false);

      fireEvent.click(screen.getByRole('button', { name: 'Done' }));

      expect(toast.error).toHaveBeenCalledWith('First Name is required.');

      expect(clientService.update).not.toHaveBeenCalled();
      expect(clientService.create).not.toHaveBeenCalled();
    });

    it('should show an error when save fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(clientService.update).mockRejectedValue(new Error('Save failed'));

      renderClientActions(existingClient, false);

      fireEvent.click(screen.getByRole('button', { name: 'Done' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save client.');
      });

      consoleError.mockRestore();
    });
  });

  describe('Delete Client', () => {
    it('should delete the client after confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(clientService.delete).mockResolvedValue(undefined);

      const { setClient, setIsNewClient, setIsLocked, clearClientLookup } = renderClientActions(
        existingClient,
        false,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Delete Client' }));

      await waitFor(() => {
        expect(clientService.delete).toHaveBeenCalledWith(123);
      });

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this client?');

      expect(toast.success).toHaveBeenCalledWith('Client deleted successfully.');

      expect(setClient).toHaveBeenCalledWith(emptyClient);
      expect(setIsNewClient).toHaveBeenCalledWith(true);
      expect(setIsLocked).toHaveBeenCalledWith(true);
      expect(clearClientLookup).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('should not delete when confirmation is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderClientActions(existingClient, false);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Client' }));

      expect(window.confirm).toHaveBeenCalled();
      expect(clientService.delete).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('should not delete when the client has no childId', () => {
      renderClientActions(emptyClient, false);

      const deleteButton = screen.getByRole('button', {
        name: 'Delete Client',
      });

      expect(deleteButton).toBeDisabled();

      fireEvent.click(deleteButton);

      expect(clientService.delete).not.toHaveBeenCalled();
    });

    it('should not delete when the client is locked', () => {
      renderClientActions(existingClient, true);

      const deleteButton = screen.getByRole('button', {
        name: 'Delete Client',
      });

      expect(deleteButton).toBeDisabled();

      fireEvent.click(deleteButton);

      expect(clientService.delete).not.toHaveBeenCalled();
    });

    it('should show an error when delete fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.spyOn(window, 'confirm').mockReturnValue(true);

      vi.mocked(clientService.delete).mockRejectedValue(new Error('Delete failed'));

      renderClientActions(existingClient, false);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Client' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete client.');
      });

      consoleError.mockRestore();
      vi.restoreAllMocks();
    });
  });

  describe('Add New Client', () => {
    it('should clear the client and unlock the form', () => {
      const { setClient, setIsLocked, clearClientLookup } = renderClientActions(
        existingClient,
        true,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add New Client' }));

      expect(setClient).toHaveBeenCalledWith(emptyClient);
      expect(setIsLocked).toHaveBeenCalledWith(false);
      expect(clearClientLookup).toHaveBeenCalled();
    });
  });

  describe('Lock / Unlock', () => {
    it('should toggle the lock state', () => {
      const { setIsLocked } = renderClientActions(existingClient, false);

      fireEvent.click(screen.getByRole('button', { name: 'Lock' }));

      expect(setIsLocked).toHaveBeenCalledWith(expect.any(Function));

      const updater = setIsLocked.mock.calls[0][0];

      expect(updater(false)).toBe(true);
    });

    it('should unlock a locked client', () => {
      const { setIsLocked } = renderClientActions(existingClient, true);

      fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

      expect(setIsLocked).toHaveBeenCalledWith(expect.any(Function));

      const updater = setIsLocked.mock.calls[0][0];

      expect(updater(true)).toBe(false);
    });
  });
});
