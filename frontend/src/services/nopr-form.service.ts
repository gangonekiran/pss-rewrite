import { api } from './api';

import type {
  NoprFormDefaults,
  NoprFormOptions,
  NoprFormRecord,
  NoprFormResponse,
} from '../types/nopr-form';

const BASE_URL = '/nopr-forms';

class NoprFormService {
  /** Client and all of their NOPR forms. */
  async get(childId: number): Promise<NoprFormResponse> {
    const response = await api.get<NoprFormResponse>(`${BASE_URL}/${childId}`);
    return response.data;
  }

  /** Region for a new form and the most recent referral date. */
  async defaults(childId: number): Promise<NoprFormDefaults> {
    const response = await api.get<NoprFormDefaults>(`${BASE_URL}/${childId}/defaults`);
    return response.data;
  }

  async create(childId: number, payload: Record<string, unknown>): Promise<NoprFormRecord> {
    const response = await api.post<NoprFormRecord>(`${BASE_URL}/${childId}`, payload);
    return response.data;
  }

  async update(
    childId: number,
    id: number,
    payload: Record<string, unknown>,
  ): Promise<NoprFormRecord> {
    const response = await api.put<NoprFormRecord>(`${BASE_URL}/${childId}/${id}`, payload);
    return response.data;
  }

  async options(): Promise<NoprFormOptions> {
    const response = await api.get<NoprFormOptions>(`${BASE_URL}/lookups/options`);
    return response.data;
  }
}

export default new NoprFormService();
