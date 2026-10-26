import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import exitFormService from './exit-form.service';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('exitFormService', () => {
  it('get: loads the client and their Exit forms', async () => {
    const data = { client: { ChildID: 123 }, forms: [] };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(exitFormService.get(123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/exit-forms/123');
  });

  it('defaults: loads the prefill values', async () => {
    const data = { Region: 2, ReferralDate: '2025-02-15' };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(exitFormService.defaults(123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/exit-forms/123/defaults');
  });

  it('create: posts the payload', async () => {
    const payload = { Region: 2, ExitDate: '2025-06-01' };
    vi.mocked(api.post).mockResolvedValue({ data: { ID: 8, ...payload } });

    await expect(exitFormService.create(123, payload)).resolves.toEqual({ ID: 8, ...payload });
    expect(api.post).toHaveBeenCalledWith('/exit-forms/123', payload);
  });

  it('update: puts the payload', async () => {
    const payload = { ReferredTo: 99 };
    vi.mocked(api.put).mockResolvedValue({ data: { ID: 7, ...payload } });

    await expect(exitFormService.update(123, 7, payload)).resolves.toEqual({ ID: 7, ...payload });
    expect(api.put).toHaveBeenCalledWith('/exit-forms/123/7', payload);
  });

  it('options: loads the code lists', async () => {
    const data = { exitPriorToAge3: [], exitAtAge3: [], referredTo: [] };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(exitFormService.options()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/exit-forms/lookups/options');
  });

  it('passes request errors on', async () => {
    const error = new Error('Network Error');
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(exitFormService.get(123)).rejects.toBe(error);
  });
});
