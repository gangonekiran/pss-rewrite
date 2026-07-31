import { Request, Response, NextFunction } from "express";

export class DashboardController {

    static async getDashboard(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            return res.json({

                success: true,

                message: "Welcome to Dashboard",

                user: req.user

            });

        } catch (error) {

            next(error);

        }

    }

}