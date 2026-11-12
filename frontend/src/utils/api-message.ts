import axios from 'axios';

/** The message the API sent with an error response, or `fallback` for anything else. */
export function apiMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallback;
  }
  return fallback;
}
