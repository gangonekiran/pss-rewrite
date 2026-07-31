import { AuthUser } from "../models/AuthUser";
import { Session } from "../models/Session";
import { TokenService } from "./TokenService";
import { AuthConfig } from "../../config/auth";

export class SessionService {

    constructor(
        private readonly tokenService = new TokenService()
    ) {}

    /**
     * Create authenticated session
     */
    async createSession(user: AuthUser): Promise<Session> {

        const accessToken =
            await this.tokenService.generateAccessToken(user);

        const refreshToken =
            await this.tokenService.generateRefreshToken(user);

        return {

            accessToken,

            refreshToken,

            expiresAt:
                Date.now() +
                AuthConfig.cookie.accessTokenMaxAge * 1000,

            user

        };

    }

    /**
     * Validate session
     */
    async validateSession(
        accessToken: string
    ): Promise<AuthUser> {

        return await this.tokenService.verifyAccessToken(
            accessToken
        );

    }

    /**
     * Refresh session
     */
    async refreshSession(
        refreshToken: string
    ): Promise<AuthUser> {

        const payload =
            await this.tokenService.verifyRefreshToken(
                refreshToken
            );

        return {

            id: payload.id as string,

            username: payload.username as string,

            email: payload.email as string,

            firstName: payload.firstName as string,

            lastName: payload.lastName as string,

            roles: payload.roles as string[],

            permissions: payload.permissions as string[],

            isAuthenticated: true

        };

    }

    /**
     * Destroy session
     * (Currently stateless because JWT is stored in cookies)
     */
    async destroySession(): Promise<void> {

        return;

    }

}