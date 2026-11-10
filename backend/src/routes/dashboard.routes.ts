import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";
import { DashboardController } from "../controllers/DashboardController.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize(["ADMIN"]),
    DashboardController.getDashboard
);

export default router;