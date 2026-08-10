import { Router } from "express";
import * as controller from "./input-form.controller";
import { history } from "./input-form.history.controller";

const router = Router();

// IMPORTANT: keep this route before /:form/:childId.
// Otherwise Express treats "history" as the form name.
router.get("/history/:childId", history);

router.get("/:form/:childId", controller.getByChildId);
router.get("/:form/:childId/:id", controller.getOne);
router.post("/:form/:childId", controller.create);
router.put("/:form/:childId/:id", controller.update);
router.delete("/:form/:childId/:id", controller.remove);

export default router;
