import { Request, Response, NextFunction } from "express";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {

    console.error(err, req.method, req.url, next);

    return res.status(500).json({

        success: false,

        message: err.message || "Internal Server Error"

    });

}