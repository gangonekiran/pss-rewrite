import { api } from './api';

export const authService = {
  login: (payload: unknown) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};
