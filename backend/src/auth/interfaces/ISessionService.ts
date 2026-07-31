import { Session } from "../models/Session";

export interface ISessionService {

    createSession(session: Session): Promise<void>;

    getSession(): Promise<Session | null>;

    refreshSession(): Promise<Session | null>;

    invalidateSession(): Promise<void>;

    isSessionValid(): Promise<boolean>;

}