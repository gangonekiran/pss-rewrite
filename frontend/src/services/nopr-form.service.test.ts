import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import noprFormService from './nopr-form.service';

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

describe('noprFormService', () => {
  it('get: loads the client and their NOPR forms', async () => {
    const data = { client: { ChildID: 123 }, forms: [] };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(noprFormService.get(123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/nopr-forms/123');
  });

  it('defaults: loads the region and the most recent referral date', async () => {
    const data = { Region: 3, MostRecentReferralDate: '2026-01-05' };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(noprFormService.defaults(123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/nopr-forms/123/defaults');
  });

  it('create: posts the payload', async () => {
    const payload = { Region: 3, RefStatus: 8, StatusDate: '2026-02-02' };
    vi.mocked(api.post).mockResolvedValue({ data: { ID: 8, ...payload } });

    await expect(noprFormService.create(123, payload)).resolves.toEqual({ ID: 8, ...payload });
    expect(api.post).toHaveBeenCalledWith('/nopr-forms/123', payload);
  });

  it('update: puts the payload', async () => {
    const payload = { RefStatus: 6 };
    vi.mocked(api.put).mockResolvedValue({ data: { ID: 7, ...payload } });

    await expect(noprFormService.update(123, 7, payload)).resolves.toEqual({ ID: 7, ...payload });
    expect(api.put).toHaveBeenCalledWith('/nopr-forms/123/7', payload);
  });

  it('options: loads the reasons', async () => {
    const data = { refStatus: [], retiredRefStatus: [] };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(noprFormService.options()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/nopr-forms/lookups/options');
  });

  it('passes request errors on', async () => {
    const error = new Error('Network Error');
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(noprFormService.get(123)).rejects.toBe(error);
  });
});
