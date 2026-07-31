import { Request, Response, NextFunction } from "express";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {

    console.error(err);

    return res.status(500).json({

        success: false,

        message: err.message || "Internal Server Error"

    });

}