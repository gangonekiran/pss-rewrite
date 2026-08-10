import { api } from "./api";
import type {
  InputFormHistoryItem,
  InputFormName,
  InputFormPayload,
} from "../types/input-form";

const BASE_URL = "/input-forms";

class InputFormService {
  async getHistory(childId: number): Promise<InputFormHistoryItem[]> {
    const response = await api.get<InputFormHistoryItem[]>(
      `${BASE_URL}/history/${childId}`,
    );

    return response.data;
  }

  async getByChildId(
    formName: InputFormName,
    childId: number,
  ): Promise<Record<string, unknown>[]> {
    const response = await api.get<Record<string, unknown>[]>(
      `${BASE_URL}/${formName}/${childId}`,
    );

    return response.data;
  }

  async getOne(
    formName: InputFormName,
    childId: number,
    id: number,
  ): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>(
      `${BASE_URL}/${formName}/${childId}/${id}`,
    );

    return response.data;
  }

  async create(
    formName: InputFormName,
    childId: number,
    payload: InputFormPayload,
  ): Promise<Record<string, unknown>> {
    const response = await api.post<Record<string, unknown>>(
      `${BASE_URL}/${formName}/${childId}`,
      payload,
    );

    return response.data;
  }

  async update(
    formName: InputFormName,
    childId: number,
    id: number,
    payload: InputFormPayload,
  ): Promise<Record<string, unknown>> {
    const response = await api.put<Record<string, unknown>>(
      `${BASE_URL}/${formName}/${childId}/${id}`,
      payload,
    );

    return response.data;
  }

  async remove(
    formName: InputFormName,
    childId: number,
    id: number,
  ): Promise<void> {
    await api.delete(`${BASE_URL}/${formName}/${childId}/${id}`);
  }
}

export default new InputFormService();
