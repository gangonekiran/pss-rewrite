import { Request, Response, NextFunction } from "express";
import { ServiceContainer } from "../container/ServiceContainer";

const tokenService = ServiceContainer.getTokenService();
const cookieService = ServiceContainer.getCookieService();

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {

    try {

        const accessToken =
            req.cookies[
                cookieService.getAccessTokenCookieName()
            ];

        if (!accessToken) {

            return res.status(401).json({

                success: false,

                message: "Authentication Required"

            });

        }

        const user =
            await tokenService.verifyAccessToken(
                accessToken
            );

        req.user = user;

        next();

    } catch (error) {

        console.error("Authentication Error:", error);

        return res.status(401).json({

            success: false,

            message: "Invalid or Expired Token"

        });

    }

}