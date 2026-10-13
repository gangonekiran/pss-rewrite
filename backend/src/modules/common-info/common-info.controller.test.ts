import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';

import * as service from './common-info.service';
import { regions, towns } from './common-info.controller';

vi.mock('./common-info.service', () => ({
  lookups: {
    regions: vi.fn(),
    towns: vi.fn(),
    town: vi.fn(),
  },
}));

const townList = [
  {
    Town: '001',
    TownName: 'St. Albans Town',
    SU_id: 12,
    CountyCode: 'FR',
    CountyName: 'Franklin',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Common Info Controller - regions', () => {
  it('should return the regions', async () => {
    const mockData = [
      { ID: 1, RName: 'Burlington', Description: null, Inactive: false },
    ];

    vi.mocked(service.lookups.regions).mockResolvedValue(mockData);

    const req = createRequest({
      method: 'GET',
      url: '/api/common-info/regions',
    });

    const res = createResponse();

    await regions(req, res);

    expect(service.lookups.regions).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockData);
  });

  it('should throw when the service fails', async () => {
    vi.mocked(service.lookups.regions).mockRejectedValue(
      new Error('connection lost'),
    );

    const req = createRequest({ method: 'GET' });
    const res = createResponse();

    await expect(regions(req, res)).rejects.toThrow('connection lost');
    expect(res._isEndCalled()).toBe(false);
  });
});

describe('Common Info Controller - towns', () => {
  it('should pass the search query to the service', async () => {
    vi.mocked(service.lookups.towns).mockResolvedValue(townList);

    const req = createRequest({
      method: 'GET',
      query: {
        search: 'Alb',
      },
    });

    const res = createResponse();

    await towns(req, res);

    expect(service.lookups.towns).toHaveBeenCalledWith('Alb');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(townList);
  });

  it('should pass undefined when there is no search query', async () => {
    vi.mocked(service.lookups.towns).mockResolvedValue(townList);

    const req = createRequest({ method: 'GET' });
    const res = createResponse();

    await towns(req, res);

    expect(service.lookups.towns).toHaveBeenCalledWith(undefined);
    expect(res._getJSONData()).toEqual(townList);
  });

  it('should ignore search when it is sent more than once', async () => {
    vi.mocked(service.lookups.towns).mockResolvedValue([]);

    const req = createRequest({
      method: 'GET',
      query: {
        search: ['a', 'b'],
      },
    });

    const res = createResponse();

    await towns(req, res);

    expect(service.lookups.towns).toHaveBeenCalledWith(undefined);
  });
});
