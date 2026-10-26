import { Router } from "express";
import * as controller from "./exit-form.controller.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ExitFormInput:
 *       type: object
 *       description: >
 *         Writable stblExitForm columns. Every field is optional on update.
 *         Dates use YYYY-MM-DD. Yes/No fields accept true/false, "yes"/"no"
 *         or -1/0 and are stored as -1 (Yes) / 0 (No). FormType is always
 *         saved as 'Exit'. FormDate defaults to ExitDate.
 *       properties:
 *         FormDate: { type: string, format: date }
 *         Region: { type: integer, example: 1 }
 *         MonthReporting: { type: integer, nullable: true }
 *         SU_id: { type: integer, nullable: true }
 *         Town: { type: string, maxLength: 3, nullable: true }
 *         SvcCordFirstName: { type: string, maxLength: 50, nullable: true }
 *         SvcCordLastName: { type: string, maxLength: 50, nullable: true }
 *         SvcCordType: { type: integer, nullable: true }
 *         SvcCordOtherDesc: { type: string, maxLength: 255, nullable: true }
 *         CAPTA: { type: boolean, nullable: true }
 *         ReferralDate: { type: string, format: date, nullable: true }
 *         ReReferralDate: { type: string, format: date, nullable: true }
 *         ExitDate: { type: string, format: date, description: Required on create }
 *         TransitionPlanCompleted: { type: string, format: date, nullable: true, description: Cannot be before ReferralDate }
 *         TransitionPlanReason: { type: string, nullable: true, description: Transition plan delay reason (family or provider circumstance) }
 *         CLLEANotificationDate: { type: string, format: date, nullable: true, description: LEA Notification Date. Cannot be before ReferralDate }
 *         Notified90Days: { type: boolean, nullable: true }
 *         NotifiedReason: { type: string, nullable: true }
 *         NotifyStatePartC: { type: boolean, nullable: true }
 *         TransitionMeeting: { type: string, format: date, nullable: true }
 *         TransitionMeeting90day: { type: boolean, nullable: true }
 *         NoTransitionMtgReason: { type: string, nullable: true }
 *         COSFEnter30Months: { type: boolean, nullable: true }
 *         COSFEntryForm: { type: boolean, nullable: true }
 *         COSFEntryFormReason: { type: string, nullable: true }
 *         COSFGot6MonthsSvcs: { type: boolean, nullable: true }
 *         COSFExitForm: { type: boolean, nullable: true }
 *         COSFExitFormReason: { type: string, nullable: true }
 *         ExitPriorToAge3: { type: integer, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8], nullable: true, description: 7 = Non-EI Client Exit, 8 = Referral to CIS-EI, 0 = exited at age 3 instead (set automatically) }
 *         MovedOtherRegion: { type: string, maxLength: 255, nullable: true, description: Only kept when ExitPriorToAge3 = 2 }
 *         ExitAtAge3: { type: integer, enum: [0, 1, 2, 3, 4], nullable: true, description: 0 = exited prior to age 3 instead (set automatically). Cannot be combined with a non-zero ExitPriorToAge3 }
 *         EXFNoPartB1: { type: boolean, description: Only kept when ExitAtAge3 = 4 }
 *         EXFNoPartB2: { type: boolean }
 *         EXFNoPartB3: { type: boolean }
 *         ReferredTo: { type: integer, enum: [1, 2, 3, 4, 5, 99], nullable: true, description: 5 = Other, 99 = Exited with no referral. Required when ExitAtAge3 = 4 }
 *     ExitForm:
 *       allOf:
 *         - $ref: "#/components/schemas/ExitFormInput"
 *         - type: object
 *           properties:
 *             ID: { type: integer }
 *             ChildID: { type: integer }
 *             FormType: { type: string, example: Exit }
 *             CAPTA: { type: integer, nullable: true, example: -1 }
 */

/**
 * @swagger
 * /api/exit-forms/lookups/options:
 *   get:
 *     tags: [Exit Forms]
 *     summary: Code lists for the Exit form
 *     description: Exit reasons prior to age 3, exit at age 3 outcomes and referred-to options.
 *     responses:
 *       200:
 *         description: Option lists
 */
router.get("/lookups/options", controller.options);

/**
 * @swagger
 * /api/exit-forms/{childId}:
 *   get:
 *     tags: [Exit Forms]
 *     summary: Get the client and all of their Exit forms
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Client and forms (newest exit first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client: { $ref: "#/components/schemas/Client" }
 *                 forms:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/ExitForm" }
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   post:
 *     tags: [Exit Forms]
 *     summary: Create an Exit form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/ExitFormInput" }
 *     responses:
 *       201:
 *         description: Created form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ExitForm" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:childId", controller.get);
router.post("/:childId", controller.create);

/**
 * @swagger
 * /api/exit-forms/{childId}/defaults:
 *   get:
 *     tags: [Exit Forms]
 *     summary: Prefill values for a new Exit form
 *     description: >
 *       Region and Date of Referral, copied from the latest Active form,
 *       falling back to the latest Referral form.
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Default values
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:childId/defaults", controller.defaults);

/**
 * @swagger
 * /api/exit-forms/{childId}/{id}:
 *   get:
 *     tags: [Exit Forms]
 *     summary: Get one Exit form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: The form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ExitForm" }
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   put:
 *     tags: [Exit Forms]
 *     summary: Update an Exit form (partial)
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/ExitFormInput" }
 *     responses:
 *       200:
 *         description: Updated form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ExitForm" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   delete:
 *     tags: [Exit Forms]
 *     summary: Delete an Exit form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:childId/:id", controller.getOne);
router.put("/:childId/:id", controller.update);
router.delete("/:childId/:id", controller.remove);

export default router;
