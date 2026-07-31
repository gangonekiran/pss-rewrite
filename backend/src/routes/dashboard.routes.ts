import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { DashboardController } from "../controllers/DashboardController";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize(["ADMIN"]),
    DashboardController.getDashboard
);

export default router;