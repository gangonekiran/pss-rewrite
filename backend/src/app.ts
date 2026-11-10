import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import clientRoutes from "./modules/client/client.routes.js";
import inputFormRoutes from "./modules/input-form/input-form.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { activeFormRoutes } from "./modules/active-form/index.js";
import { commonInfoRoutes } from "./modules/common-info/index.js";
import { exitFormRoutes } from "./modules/exit-form/index.js";
import { insuranceFormRoutes } from "./modules/insurance-form/index.js";

const app = express();

/**
 * CORS
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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

app.use('/api/active-forms', activeFormRoutes);

app.use('/api/exit-forms', exitFormRoutes);

app.use('/api/insurance-forms', insuranceFormRoutes);

app.use('/api/common-info', commonInfoRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);

app.get("/api-docs/swagger.json", (_req, res) => {
  res.json(swaggerSpec);
});

/**
 * Error Handler
 *
 * IMPORTANT:
 * This must be AFTER all routes.
 */
app.use(errorHandler);

export default app;