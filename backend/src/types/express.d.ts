import { AuthUser } from "../auth/models/AuthUser.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export {};