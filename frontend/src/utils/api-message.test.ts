import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { apiMessage } from './api-message';

function axiosError(data: unknown) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}

describe('apiMessage', () => {
  it('returns the message the API sent', () => {
    expect(apiMessage(axiosError({ message: 'Region must be selected' }), 'Failed')).toBe(
      'Region must be selected',
    );
  });

  it('falls back to the error field', () => {
    expect(apiMessage(axiosError({ error: 'Not found' }), 'Failed')).toBe('Not found');
  });

  it('returns the fallback when the response has no message', () => {
    expect(apiMessage(axiosError({}), 'Failed')).toBe('Failed');
  });

  it('returns the fallback for errors that are not from axios', () => {
    expect(apiMessage(new Error('Network down'), 'Failed')).toBe('Failed');
  });
});
