import { AuthUser } from "./AuthUser";

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}