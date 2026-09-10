import { api } from './api';

import type {
  ActiveFormRecord,
  ActiveFormResponse,
  DelayReasonsResponse,
  RegionLookup,
  ServiceCoordinatorTypeLookup,
  SupervisoryUnionLookup,
  TownLookup,
} from '../types/active-form';

const BASE_URL = '/active-forms';

class ActiveFormService {
  /**
   * Get all Active Forms for a client
   */
  async get(childId: number): Promise<ActiveFormResponse> {
    const response = await api.get<ActiveFormResponse>(`${BASE_URL}/${childId}`);

    return response.data;
  }

  /**
   * Get one Active Form
   */
  async getOne(childId: number, id: number): Promise<ActiveFormRecord> {
    const response = await api.get<ActiveFormRecord>(`${BASE_URL}/${childId}/${id}`);

    return response.data;
  }

  /**
   * Create Active Form
   */
  async create(childId: number, payload: ActiveFormRecord): Promise<ActiveFormRecord> {
    const response = await api.post<ActiveFormRecord>(`${BASE_URL}/${childId}`, payload);

    return response.data;
  }

  /**
   * Update Active Form
   */
  async update(childId: number, id: number, payload: ActiveFormRecord): Promise<ActiveFormRecord> {
    const response = await api.put<ActiveFormRecord>(`${BASE_URL}/${childId}/${id}`, payload);

    return response.data;
  }

  /**
   * Delete Active Form
   */
  async delete(childId: number, id: number): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`${BASE_URL}/${childId}/${id}`);

    return response.data;
  }

  async regions(): Promise<RegionLookup[]> {
    const response = await api.get<RegionLookup[]>(`${BASE_URL}/lookups/regions`);
    return response.data;
  }

  async supervisoryUnions(): Promise<SupervisoryUnionLookup[]> {
    const response = await api.get<SupervisoryUnionLookup[]>(
      `${BASE_URL}/lookups/supervisory-unions`,
    );
    return response.data;
  }

  async towns(search?: string): Promise<TownLookup[]> {
    const response = await api.get<TownLookup[]>(`${BASE_URL}/lookups/towns`, {
      params: search ? { search } : undefined,
    });
    return response.data;
  }

  async serviceCoordinatorTypes(): Promise<ServiceCoordinatorTypeLookup[]> {
    const response = await api.get<ServiceCoordinatorTypeLookup[]>(
      `${BASE_URL}/lookups/service-coordinator-types`,
    );
    return response.data;
  }

  async delayReasons(): Promise<DelayReasonsResponse> {
    const response = await api.get<DelayReasonsResponse>(`${BASE_URL}/lookups/delay-reasons`);
    return response.data;
  }
}

export default new ActiveFormService();
