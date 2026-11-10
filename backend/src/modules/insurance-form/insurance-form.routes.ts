import { Router } from "express";
import * as controller from "./insurance-form.controller.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InsuranceFormInput:
 *       type: object
 *       description: >
 *         Writable stblInsuranceForm columns. Every field is optional on update.
 *         Dates use YYYY-MM-DD. FormType is always saved as 'Insurance'.
 *         InsCoNumber, InsuranceName, CoverageCode and Phone are not written,
 *         so existing values are kept.
 *       properties:
 *         FormDate: { type: string, format: date, description: Date Completed. Required }
 *         BranchAddress: { type: string, maxLength: 255, nullable: true, description: Insurance Company Name. Required when BillingConsent = 1 }
 *         PolicyNumber: { type: string, maxLength: 255, nullable: true }
 *         GroupNumber: { type: string, maxLength: 255, nullable: true }
 *         GroupName: { type: string, maxLength: 255, nullable: true, description: Group/Employer Name }
 *         EffectiveDate: { type: string, format: date, nullable: true }
 *         EndDate: { type: string, format: date, nullable: true, description: Cannot be before EffectiveDate }
 *         PolicyHolder: { type: string, maxLength: 255, nullable: true, description: Individual Policy Holder }
 *         BillingConsent: { type: integer, enum: [1, 2, 3], description: "1 = private insurance, 2 = Medicaid, 3 = decline (FITP: Do Not Bill). Required" }
 *         ParentSignatureDate: { type: string, format: date, nullable: true, description: Required when BillingConsent is 1 or 2; cleared when 3 }
 *         DeclineReasonCap: { type: boolean, description: "Exactly one DeclineReason* is true when BillingConsent = 3; all false otherwise" }
 *         DeclineReasonPremium: { type: boolean }
 *         DeclineReasonBenefits: { type: boolean }
 *         DeclineReasonEligibility: { type: boolean }
 *         ParentSignatureDate2: { type: string, format: date, nullable: true, description: Required when BillingConsent = 3; cleared otherwise }
 *     InsuranceForm:
 *       allOf:
 *         - $ref: "#/components/schemas/InsuranceFormInput"
 *         - type: object
 *           properties:
 *             ID: { type: integer }
 *             ChildID: { type: integer }
 *             FormType: { type: string, example: Insurance }
 *             InsCoNumber: { type: string, nullable: true }
 *             InsuranceName: { type: string, nullable: true }
 *             CoverageCode: { type: string, nullable: true }
 *             Phone: { type: string, nullable: true }
 */

/**
 * @swagger
 * /api/insurance-forms/lookups/options:
 *   get:
 *     tags: [Insurance Forms]
 *     summary: Code lists for the Insurance form
 *     description: Billing consent choices and the reasons for denying private insurance billing.
 *     responses:
 *       200:
 *         description: Option lists
 */
router.get("/lookups/options", controller.options);

/**
 * @swagger
 * /api/insurance-forms/{childId}:
 *   get:
 *     tags: [Insurance Forms]
 *     summary: Get the client and all of their Insurance forms
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Client and forms (newest Date Completed first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client: { $ref: "#/components/schemas/Client" }
 *                 forms:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/InsuranceForm" }
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   post:
 *     tags: [Insurance Forms]
 *     summary: Create an Insurance form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/InsuranceFormInput" }
 *     responses:
 *       201:
 *         description: Created form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/InsuranceForm" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:childId", controller.get);
router.post("/:childId", controller.create);

/**
 * @swagger
 * /api/insurance-forms/{childId}/{id}:
 *   get:
 *     tags: [Insurance Forms]
 *     summary: Get one Insurance form
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: The form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/InsuranceForm" }
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   put:
 *     tags: [Insurance Forms]
 *     summary: Update an Insurance form (partial)
 *     parameters:
 *       - { in: path, name: childId, required: true, schema: { type: integer } }
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/InsuranceFormInput" }
 *     responses:
 *       200:
 *         description: Updated form
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/InsuranceForm" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *   delete:
 *     tags: [Insurance Forms]
 *     summary: Delete an Insurance form
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
