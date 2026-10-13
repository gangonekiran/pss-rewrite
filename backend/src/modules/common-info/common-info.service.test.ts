import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as repository from './common-info.repository';
import { lookups } from './common-info.service';

vi.mock('./common-info.repository', () => ({
  getAllRegions: vi.fn(),
  getTowns: vi.fn(),
  getTown: vi.fn(),
}));

const town = {
  Town: '001',
  TownName: 'St. Albans Town',
  SU_id: 12,
  CountyCode: 'FR',
  CountyName: 'Franklin',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Common Info Service - regions', () => {
  it('should return the regions from the repository', async () => {
    const regions = [
      { ID: 1, RName: 'Burlington', Description: null, Inactive: false },
    ];

    vi.mocked(repository.getAllRegions).mockResolvedValue(regions);

    const result = await lookups.regions();

    expect(result).toEqual(regions);
    expect(repository.getAllRegions).toHaveBeenCalledTimes(1);
  });

  it('should throw the repository error', async () => {
    vi.mocked(repository.getAllRegions).mockRejectedValue(
      new Error('connection lost'),
    );

    await expect(lookups.regions()).rejects.toThrow('connection lost');
  });
});

describe('Common Info Service - towns', () => {
  it('should pass the search text to the repository', async () => {
    vi.mocked(repository.getTowns).mockResolvedValue([town]);

    const result = await lookups.towns('Alb');

    expect(result).toEqual([town]);
    expect(repository.getTowns).toHaveBeenCalledWith('Alb');
  });

  it('should work without a search', async () => {
    vi.mocked(repository.getTowns).mockResolvedValue([]);

    const result = await lookups.towns();

    expect(result).toEqual([]);
    expect(repository.getTowns).toHaveBeenCalledWith(undefined);
  });
});

describe('Common Info Service - town', () => {
  it('should return one town', async () => {
    vi.mocked(repository.getTown).mockResolvedValue(town);

    const result = await lookups.town('001');

    expect(result).toEqual(town);
    expect(repository.getTown).toHaveBeenCalledWith('001');
  });

  it('should return undefined when the town does not exist', async () => {
    vi.mocked(repository.getTown).mockResolvedValue(undefined);

    const result = await lookups.town('ZZZ');

    expect(result).toBeUndefined();
  });
});
