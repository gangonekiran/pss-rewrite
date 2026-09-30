import { api } from './api';

import type { RegionLookup, TownLookup } from '../types/common';

const BASE_URL = '/common-info';

class CommonInfoService {  

  async regions(): Promise<RegionLookup[]> {
    const response = await api.get<RegionLookup[]>(`${BASE_URL}/regions`);
    return response.data;
  }
  
  async towns(search?: string): Promise<TownLookup[]> {
    const response = await api.get<TownLookup[]>(`${BASE_URL}/towns`, {
      params: search ? { search } : undefined,
    });
    return response.data;
  }
  
}

export default new CommonInfoService();
