import { Router } from "express";
import * as controller from "./nopr-form.controller.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NoprFormInput:
 *       type: object
 *       description: >
 *         Writable stblNoOnePlanForm columns. Every field is optional on update.
 *         Dates use YYYY-MM-DD. FormType is always saved as 'No One Plan', and
 *         FormDate always follows StatusDate (FITP reads it as the date the
 *         voucher is turned off). MonthReporting, Screening and ReferredBack are
 *         not written, so existing values are kept.
 *       properties:
 *         Region: { type: integer, example: 3, description: Required }
 *         RefStatus: { type: integer, enum: [8, 1, 2, 3, 4, 5, 6, 7], description: "Reason no plan resulted. Required. 8 = Initial Contact Not Made (new). 7 = Turned 3 during evaluation process is retired: kept on forms that already have it, but can't be chosen" }
 *         InitialEvalDate: { type: string, format: date, nullable: true, description: "Date of Initial Evaluation. Optional; not before DOB; not after StatusDate" }
 *         StatusDate: { type: string, format: date, description: "Date above status was determined. Required; not before DOB or the most recent referral date. Also saved as FormDate" }
 *     NoprForm:
 *       allOf:
 *         - $ref: "#/components/schemas/NoprFormInput"
 *         - type: object
 *           properties:
 *             ID: { type: integer }
 *             ChildID: { type: integer }
 *             FormDate: { type: string, description: Same as StatusDate }
 *             FormType: { type: string, example: No One Plan }
 *             MonthReporting: { type: integer, nullable: true }
 *             Screening: { type: integer, nullable: true }
 *             ReferredBack: { type: boolean, nullable: true }
 */

/**
 * @swagger
 * /api/nopr-forms/lookups/options:
 *   get:
 *     tags: [NOPR Forms]
 *     summary: Reasons for the NOPR form
 *     description: The reasons that can be chosen, and the retired reasons kept on older forms.
 *     responses:
 *       200:
 *         description: Option lists
 */
router.get("/lookups/options", controller.options);

/**
 * @swagger
 * /api/nopr-forms/{childId}:
 *   get:
 *     tags: [NOPR Forms]
 *     summary: Get the client and all of their NOPR forms
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Client and forms (newest status first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client: { $ref: "#/components/schemas/Client" }
 *                 forms:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/NoprForm" }
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   post:
 *     tags: [NOPR Forms]
 *     summary: Create a NOPR form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/NoprFormInput" }
 *     responses:
 *       201:
 *         description: Created form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NoprForm" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:childId", controller.get);
router.post("/:childId", controller.create);

/**
 * @swagger
 * /api/nopr-forms/{childId}/defaults:
 *   get:
 *     tags: [NOPR Forms]
 *     summary: Prefill values for a new NOPR form
 *     description: >
 *       Region from the latest Active form, falling back to the latest Referral
 *       form and then the client; and the most recent referral date (latest
 *       Referral Date or Re-referral Date), which StatusDate can't be before.
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
 * /api/nopr-forms/{childId}/{id}:
 *   get:
 *     tags: [NOPR Forms]
 *     summary: Get one NOPR form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: The form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NoprForm" }
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   put:
 *     tags: [NOPR Forms]
 *     summary: Update a NOPR form (partial)
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/NoprFormInput" }
 *     responses:
 *       200:
 *         description: Updated form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NoprForm" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   delete:
 *     tags: [NOPR Forms]
 *     summary: Delete a NOPR form
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
