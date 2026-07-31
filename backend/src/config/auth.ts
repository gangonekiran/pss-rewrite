import { AuthProviderType } from "../auth/enums/AuthProviderType";

export interface IAuthConfig {

    provider: AuthProviderType;

    mockMode: boolean;

    jwt: {
        issuer: string;
        audience: string;
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
        secret: string;
    };

    cookie: {
        prefix: string;
        accessToken: string;
        refreshToken: string;
        accessTokenMaxAge: number;
        refreshTokenMaxAge: number;
        secure: boolean;
        sameSite: "lax" | "strict" | "none";
        httpOnly: boolean;
        path: string;
    };

    okta: {
        issuer: string;
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };

}

export const AuthConfig: IAuthConfig = {

    /**
     * Authentication Provider
     */
    provider:
        (process.env.AUTH_PROVIDER as AuthProviderType) ??
        AuthProviderType.MOCK,

    /**
     * Mock Mode
     */
    mockMode:
        process.env.MOCK_MODE === "true",

    /**
     * JWT Configuration
     */
    jwt: {

        issuer:
            process.env.JWT_ISSUER ??
            "authentication-framework",

        audience:
            process.env.JWT_AUDIENCE ??
            "application-users",

        accessTokenExpiry:
            process.env.ACCESS_TOKEN_EXPIRY ??
            "15m",

        refreshTokenExpiry:
            process.env.REFRESH_TOKEN_EXPIRY ??
            "7d",

        secret:
            process.env.JWT_SECRET ??
            "change-this-secret-in-production"

    },

    /**
     * Cookie Configuration
     */
    cookie: {

        prefix:
            process.env.COOKIE_PREFIX ??
            "auth",

        accessToken:
            process.env.ACCESS_TOKEN_COOKIE ??
            "access_token",

        refreshToken:
            process.env.REFRESH_TOKEN_COOKIE ??
            "refresh_token",

        accessTokenMaxAge:
            Number(
                process.env.ACCESS_TOKEN_MAX_AGE ?? 900
            ),

        refreshTokenMaxAge:
            Number(
                process.env.REFRESH_TOKEN_MAX_AGE ?? 604800
            ),

        secure:
            process.env.COOKIE_SECURE === "true",

        sameSite:
            (process.env.COOKIE_SAME_SITE ??
                "lax") as "lax" | "strict" | "none",

        httpOnly:
            process.env.COOKIE_HTTP_ONLY !== "false",

        path:
            process.env.COOKIE_PATH ??
            "/"

    },

    /**
     * Okta Configuration
     */
    okta: {

        issuer:
            process.env.OKTA_ISSUER ?? "",

        clientId:
            process.env.OKTA_CLIENT_ID ?? "",

        clientSecret:
            process.env.OKTA_CLIENT_SECRET ?? "",

        redirectUri:
            process.env.OKTA_REDIRECT_URI ??
            "http://localhost:5000/api/auth/callback"

    }

};