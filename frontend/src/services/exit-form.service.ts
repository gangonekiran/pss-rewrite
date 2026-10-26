import { api } from './api';

import type {
  ExitFormDefaults,
  ExitFormOptions,
  ExitFormRecord,
  ExitFormResponse,
} from '../types/exit-form';

const BASE_URL = '/exit-forms';

class ExitFormService {
  /** Client and all of their Exit forms. */
  async get(childId: number): Promise<ExitFormResponse> {
    const response = await api.get<ExitFormResponse>(`${BASE_URL}/${childId}`);
    return response.data;
  }

  /** Prefill values (Region, Date of Referral) for a new Exit form. */
  async defaults(childId: number): Promise<ExitFormDefaults> {
    const response = await api.get<ExitFormDefaults>(`${BASE_URL}/${childId}/defaults`);
    return response.data;
  }

  async create(childId: number, payload: Record<string, unknown>): Promise<ExitFormRecord> {
    const response = await api.post<ExitFormRecord>(`${BASE_URL}/${childId}`, payload);
    return response.data;
  }

  async update(
    childId: number,
    id: number,
    payload: Record<string, unknown>,
  ): Promise<ExitFormRecord> {
    const response = await api.put<ExitFormRecord>(`${BASE_URL}/${childId}/${id}`, payload);
    return response.data;
  }

  async options(): Promise<ExitFormOptions> {
    const response = await api.get<ExitFormOptions>(`${BASE_URL}/lookups/options`);
    return response.data;
  }
}

export default new ExitFormService();
