import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";

import clientRoutes from "./modules/client/client.routes";
import inputFormRoutes from "./modules/input-form/input-form.routes";

import { errorHandler } from "./middleware/error.middleware";

const app = express();

/**
 * CORS
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/**
 * Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Health Check
 */
app.get("/", (_req, res) => {
  res.json({
    application: "Authentication Framework",
    status: "Running",
  });
});

/**
 * Routes
 */
app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/clients", clientRoutes);

app.use("/api/input-forms", inputFormRoutes);

/**
 * Error Handler
 *
 * IMPORTANT:
 * This must be AFTER all routes.
 */
app.use(errorHandler);

export default app;