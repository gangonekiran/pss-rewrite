export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
