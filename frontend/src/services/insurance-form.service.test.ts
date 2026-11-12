import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import insuranceFormService from './insurance-form.service';

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

describe('insuranceFormService', () => {
  it('get: loads the client and their Insurance forms', async () => {
    const data = { client: { ChildID: 123 }, forms: [] };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(insuranceFormService.get(123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/insurance-forms/123');
  });

  it('create: posts the payload', async () => {
    const payload = { FormDate: '2026-01-15', BillingConsent: 2 };
    vi.mocked(api.post).mockResolvedValue({ data: { ID: 8, ...payload } });

    await expect(insuranceFormService.create(123, payload)).resolves.toEqual({ ID: 8, ...payload });
    expect(api.post).toHaveBeenCalledWith('/insurance-forms/123', payload);
  });

  it('update: puts the payload', async () => {
    const payload = { PolicyNumber: 'P-2' };
    vi.mocked(api.put).mockResolvedValue({ data: { ID: 7, ...payload } });

    await expect(insuranceFormService.update(123, 7, payload)).resolves.toEqual({
      ID: 7,
      ...payload,
    });
    expect(api.put).toHaveBeenCalledWith('/insurance-forms/123/7', payload);
  });

  it('options: loads the consent choices and decline reasons', async () => {
    const data = { billingConsent: [], declineReasons: [] };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(insuranceFormService.options()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/insurance-forms/lookups/options');
  });

  it('passes request errors on', async () => {
    const error = new Error('Network Error');
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(insuranceFormService.get(123)).rejects.toBe(error);
  });
});
