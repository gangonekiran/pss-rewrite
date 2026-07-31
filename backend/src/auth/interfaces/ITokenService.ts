import { Session } from "../models/Session";

export interface ITokenService {
  createToken(session: Session): Promise<string>;

  verifyToken(token: string): Promise<Session | null>;
}