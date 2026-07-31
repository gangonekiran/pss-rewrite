import { IAuthProvider } from "../interfaces/IAuthProvider";
import { LoginRequest } from "../models/LoginRequest";
import { LoginResponse } from "../models/LoginResponse";
import { Session } from "../models/Session";

export class AuthService {

    constructor(
        private readonly provider: IAuthProvider
    ) {}

    /**
     * Authenticate User
     */
    async login(
        request: LoginRequest
    ): Promise<LoginResponse> {

        return await this.provider.login(request);

    }

    /**
     * Logout User
     */
    async logout(): Promise<void> {

        await this.provider.logout();

    }

    /**
     * Get Current Session
     */
    async getSession(): Promise<Session | null> {

        return await this.provider.getSession();

    }

    /**
     * Refresh Session
     */
    async refreshSession(): Promise<Session | null> {

        return await this.provider.refreshToken();

    }

}