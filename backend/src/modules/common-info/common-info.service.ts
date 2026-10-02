import * as repository from './common-info.repository';

export const lookups = {
  regions: () => repository.getAllRegions(),
  towns: (search?: string) => repository.getTowns(search),
  town: (town: string) => repository.getTown(town),
};
