import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import inputFormService from './input-form.service';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('inputFormService', () => {
  it('getHistory: loads the form history for a client', async () => {
    const data = [{ id: 7, formName: 'exit' }];
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(inputFormService.getHistory(123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/input-forms/history/123');
  });

  it('getByChildId: loads all forms of one type for a client', async () => {
    const data = [{ ID: 7 }, { ID: 8 }];
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(inputFormService.getByChildId('insurance', 123)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/input-forms/insurance/123');
  });

  it('getOne: loads a single form', async () => {
    const data = { ID: 7, FormType: 'Exit' };
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(inputFormService.getOne('exit', 123, 7)).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/input-forms/exit/123/7');
  });

  it('create: posts the payload', async () => {
    const payload = { FormDate: '2026-01-15', Region: '2' };
    vi.mocked(api.post).mockResolvedValue({ data: { ID: 9, ...payload } });

    await expect(inputFormService.create('referral', 123, payload)).resolves.toEqual({
      ID: 9,
      ...payload,
    });
    expect(api.post).toHaveBeenCalledWith('/input-forms/referral/123', payload);
  });

  it('update: puts the payload', async () => {
    const payload = { ReferralDate: '2026-01-01' };
    vi.mocked(api.put).mockResolvedValue({ data: { ID: 7, ...payload } });

    await expect(inputFormService.update('active', 123, 7, payload)).resolves.toEqual({
      ID: 7,
      ...payload,
    });
    expect(api.put).toHaveBeenCalledWith('/input-forms/active/123/7', payload);
  });

  it('remove: deletes the form', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await expect(inputFormService.remove('cos-cover', 123, 7)).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith('/input-forms/cos-cover/123/7');
  });

  it('passes request errors on', async () => {
    const error = new Error('Network Error');
    vi.mocked(api.delete).mockRejectedValue(error);

    await expect(inputFormService.remove('exit', 123, 7)).rejects.toBe(error);
  });
});
