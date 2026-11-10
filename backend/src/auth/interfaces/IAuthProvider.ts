import { LoginRequest } from "../models/LoginRequest.js";
import { LoginResponse } from "../models/LoginResponse.js";
import { Session } from "../models/Session.js";

export interface IAuthProvider {
  login(request: LoginRequest): Promise<LoginResponse>;

  logout(): Promise<void>;

  getSession(): Promise<Session | null>;

  refreshToken(): Promise<Session | null>;
}