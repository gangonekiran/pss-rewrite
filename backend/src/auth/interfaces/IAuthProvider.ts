import { LoginRequest } from "../models/LoginRequest";
import { LoginResponse } from "../models/LoginResponse";
import { Session } from "../models/Session";

export interface IAuthProvider {
  login(request: LoginRequest): Promise<LoginResponse>;

  logout(): Promise<void>;

  getSession(): Promise<Session | null>;

  refreshToken(): Promise<Session | null>;
}