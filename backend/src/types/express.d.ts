import { AuthUser } from "../auth/models/AuthUser";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export {};