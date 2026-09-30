import * as repository from './common-info.repository';
import type { RegionLookup } from './common-info.types';

export async function getRegions(): Promise<RegionLookup[]> {
  return repository.getAllRegions();
}

export const lookups = {
  regions: () => repository.getAllRegions()
};