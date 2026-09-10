import {Router} from "express";
import * as controller from "./active-form.controller";

const router=Router();

// Lookup routes must come before /:childId.
router.get("/lookups/regions",controller.regions);
router.get("/lookups/supervisory-unions",controller.supervisoryUnions);
router.get("/lookups/towns",controller.towns);
router.get("/lookups/service-coordinator-types",controller.serviceCoordinatorTypes);
router.get("/lookups/delay-reasons",controller.delayReasons);

router.get("/:childId",controller.get);
router.post("/:childId",controller.create);
router.get("/:childId/:id",controller.getOne);
router.put("/:childId/:id",controller.update);
router.delete("/:childId/:id",controller.remove);

export default router;
