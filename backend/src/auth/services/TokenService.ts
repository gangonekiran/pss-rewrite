import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { AuthConfig } from "../../config/auth";
import { AuthUser } from "../models/AuthUser";

const secret = new TextEncoder().encode(AuthConfig.jwt.secret);

export class TokenService {

    /**
     * Generate Access Token
     */
    async generateAccessToken(user: AuthUser): Promise<string> {

        return await new SignJWT({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            permissions: user.permissions
        })
            .setProtectedHeader({
                alg: "HS256"
            })
            .setIssuedAt()
            .setIssuer(AuthConfig.jwt.issuer)
            .setAudience(AuthConfig.jwt.audience)
            .setExpirationTime(AuthConfig.jwt.accessTokenExpiry)
            .sign(secret);
    }

    /**
     * Generate Refresh Token
     */
    async generateRefreshToken(user: AuthUser): Promise<string> {

        return await new SignJWT({
            id: user.id,
            username: user.username
        })
            .setProtectedHeader({
                alg: "HS256"
            })
            .setIssuedAt()
            .setIssuer(AuthConfig.jwt.issuer)
            .setAudience(AuthConfig.jwt.audience)
            .setExpirationTime(AuthConfig.jwt.refreshTokenExpiry)
            .sign(secret);
    }

    /**
     * Verify Access Token
     */
    async verifyAccessToken(token: string): Promise<AuthUser> {

        const { payload } = await jwtVerify(token, secret, {
            issuer: AuthConfig.jwt.issuer,
            audience: AuthConfig.jwt.audience
        });

        return this.mapPayloadToUser(payload);
    }

    /**
     * Verify Refresh Token
     */
    async verifyRefreshToken(token: string): Promise<JWTPayload> {

        const { payload } = await jwtVerify(token, secret, {
            issuer: AuthConfig.jwt.issuer,
            audience: AuthConfig.jwt.audience
        });

        return payload;
    }

    /**
     * Decode JWT Payload into AuthUser
     */
    private mapPayloadToUser(payload: JWTPayload): AuthUser {

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
}