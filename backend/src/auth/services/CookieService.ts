import { Response } from "express";
import { AuthConfig } from "../../config/auth";

export class CookieService {

    private readonly accessTokenCookieName =
        `${AuthConfig.cookie.prefix}_${AuthConfig.cookie.accessToken}`;

    private readonly refreshTokenCookieName =
        `${AuthConfig.cookie.prefix}_${AuthConfig.cookie.refreshToken}`;

    /**
     * Store Access & Refresh Tokens
     */
    setTokens(
        response: Response,
        accessToken: string,
        refreshToken: string
    ): void {

        this.setAccessToken(response, accessToken);

        this.setRefreshToken(response, refreshToken);

    }

    /**
     * Store Access Token
     */
    setAccessToken(
        response: Response,
        token: string
    ): void {

        response.cookie(
            this.accessTokenCookieName,
            token,
            {
                httpOnly: AuthConfig.cookie.httpOnly,
                secure: AuthConfig.cookie.secure,
                sameSite: AuthConfig.cookie.sameSite,
                path: AuthConfig.cookie.path,
                maxAge: AuthConfig.cookie.accessTokenMaxAge * 1000
            }
        );

    }

    /**
     * Store Refresh Token
     */
    setRefreshToken(
        response: Response,
        token: string
    ): void {

        response.cookie(
            this.refreshTokenCookieName,
            token,
            {
                httpOnly: AuthConfig.cookie.httpOnly,
                secure: AuthConfig.cookie.secure,
                sameSite: AuthConfig.cookie.sameSite,
                path: AuthConfig.cookie.path,
                maxAge: AuthConfig.cookie.refreshTokenMaxAge * 1000
            }
        );

    }

    /**
     * Clear Authentication Cookies
     */
    clearTokens(
        response: Response
    ): void {

        response.clearCookie(
            this.accessTokenCookieName
        );

        response.clearCookie(
            this.refreshTokenCookieName
        );

    }

    /**
     * Access Token Cookie Name
     */
    getAccessTokenCookieName(): string {

        return this.accessTokenCookieName;

    }

    /**
     * Refresh Token Cookie Name
     */
    getRefreshTokenCookieName(): string {

        return this.refreshTokenCookieName;

    }

}