import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import clientRoutes from './modules/client/client.routes';

import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

app.get("/", (_, res) => {
    res.json({
        application: "Authentication Framework",
        status: "Running"
    });
});

app.use('/api/clients',clientRoutes);

export default app;