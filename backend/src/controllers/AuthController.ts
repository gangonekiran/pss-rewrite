import { Request, Response, NextFunction } from "express";
import { ServiceContainer } from "../container/ServiceContainer";
import { MockUsers } from "../auth/providers/mock-users";

export class AuthController {

    private static authService =
        ServiceContainer.getAuthService();

    private static tokenService =
        ServiceContainer.getTokenService();

    private static cookieService =
        ServiceContainer.getCookieService();

    /**
     * Login
     */
    static async login(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            const loginResponse =
                await AuthController.authService.login(req.body);

            if (
                !loginResponse.success ||
                !loginResponse.session
            ) {

                return res.status(401).json({

                    success: false,

                    message: loginResponse.message

                });

            }

            AuthController.cookieService.setTokens(

                res,

                loginResponse.session.accessToken,

                loginResponse.session.refreshToken

            );

            return res.json({

                success: true,

                message: loginResponse.message,

                user: loginResponse.session.user

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Logout
     */
    static async logout(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            await AuthController.authService.logout();

            AuthController.cookieService.clearTokens(res);

            return res.json({

                success: true,

                message: "Logout Successful"

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Session
     */
    static async session(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            const accessToken =
                req.cookies[
                    AuthController.cookieService.getAccessTokenCookieName()
                ];

            if (!accessToken) {

                return res.status(401).json({

                    authenticated: false,

                    message: "Access Token Not Found"

                });

            }

            const user =
                await AuthController.tokenService.verifyAccessToken(
                    accessToken
                );

            return res.json({

                authenticated: true,

                user

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Refresh
     */
    static async refresh(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            const refreshToken =
                req.cookies[
                    AuthController.cookieService.getRefreshTokenCookieName()
                ];

            if (!refreshToken) {

                return res.status(401).json({

                    success: false,

                    message: "Refresh Token Missing"

                });

            }

            const payload =
                await AuthController.tokenService.verifyRefreshToken(
                    refreshToken
                );

            const user =
                MockUsers.find(
                    u => u.username === payload.username
                );

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message: "User Not Found"

                });

            }

            const accessToken =
                await AuthController.tokenService.generateAccessToken(
                    user
                );

            AuthController.cookieService.setAccessToken(
                res,
                accessToken
            );

            return res.json({

                success: true,

                message: "Access Token Refreshed"

            });

        } catch (error) {

            next(error);

        }

    }

}