import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import commonInfoService from './common-info.service';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('commonInfoService', () => {
  it('regions: loads the regions', async () => {
    const data = [{ ID: 1, RName: 'St Albans' }];
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(commonInfoService.regions()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/common-info/regions');
  });

  it('towns: loads all towns when there is no search text', async () => {
    const data = [{ Town: 'STA', TownName: 'St. Albans Town', SU_id: 12, CountyCode: 'FR', CountyName: 'Franklin' }];
    vi.mocked(api.get).mockResolvedValue({ data });

    await expect(commonInfoService.towns()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/common-info/towns', { params: undefined });
  });

  it('towns: sends the search text', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await expect(commonInfoService.towns('alb')).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/common-info/towns', { params: { search: 'alb' } });
  });

  it('towns: treats empty search text as no search', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await commonInfoService.towns('');
    expect(api.get).toHaveBeenCalledWith('/common-info/towns', { params: undefined });
  });

  it('passes request errors on', async () => {
    const error = new Error('Network Error');
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(commonInfoService.regions()).rejects.toBe(error);
  });
});
