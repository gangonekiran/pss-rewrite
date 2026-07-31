import { Request, Response, NextFunction } from "express";

export function authorize(
    roles: string[] = []
) {

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message: "Authentication Required"

            });

        }

        if (
            roles.length > 0 &&
            !roles.some(role =>
                req.user?.roles.includes(role)
            )
        ) {

            return res.status(403).json({

                success: false,

                message: "Access Denied"

            });

        }

        next();

    };

}