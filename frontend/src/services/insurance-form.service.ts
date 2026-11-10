import { api } from './api';

import type {
  InsuranceFormOptions,
  InsuranceFormRecord,
  InsuranceFormResponse,
} from '../types/insurance-form';

const BASE_URL = '/insurance-forms';

class InsuranceFormService {
  /** Client and all of their Insurance forms. */
  async get(childId: number): Promise<InsuranceFormResponse> {
    const response = await api.get<InsuranceFormResponse>(`${BASE_URL}/${childId}`);
    return response.data;
  }

  async create(childId: number, payload: Record<string, unknown>): Promise<InsuranceFormRecord> {
    const response = await api.post<InsuranceFormRecord>(`${BASE_URL}/${childId}`, payload);
    return response.data;
  }

  async update(
    childId: number,
    id: number,
    payload: Record<string, unknown>,
  ): Promise<InsuranceFormRecord> {
    const response = await api.put<InsuranceFormRecord>(`${BASE_URL}/${childId}/${id}`, payload);
    return response.data;
  }

  async options(): Promise<InsuranceFormOptions> {
    const response = await api.get<InsuranceFormOptions>(`${BASE_URL}/lookups/options`);
    return response.data;
  }
}

export default new InsuranceFormService();
