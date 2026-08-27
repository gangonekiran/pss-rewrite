import { Router } from "express";

import * as controller from "./input-form.controller";
import { history } from "./input-form.history.controller";

const router = Router();

/**
 * Input Form API routes.
 *
 * IMPORTANT:
 * The history route must be declared before /:form/:childId.
 *
 * Otherwise:
 * GET /api/input-forms/history/1
 *
 * could be interpreted as:
 * form = "history"
 * childId = 1
 */

/**
 * @swagger
 * /api/input-forms/history/{childId}:
 *   get:
 *     tags:
 *       - Input Forms
 *     summary: Get input form history
 *     description: Returns the input form history for a client.
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Input form history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/history/:childId", history);

/**
 * @swagger
 * /api/input-forms/{form}/{childId}:
 *   get:
 *     tags:
 *       - Input Forms
 *     summary: Get input forms for a client
 *     description: Returns all records for the specified form and client.
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *         example: referral
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Input form records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/InputForm"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:form/:childId", controller.getByChildId);

/**
 * @swagger
 * /api/input-forms/{form}/{childId}/{id}:
 *   get:
 *     tags:
 *       - Input Forms
 *     summary: Get one input form record
 *     description: Returns a single input form record for a client.
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *         example: referral
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Input form record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InputForm"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:form/:childId/:id", controller.getOne);

/**
 * @swagger
 * /api/input-forms/{form}/{childId}:
 *   post:
 *     tags:
 *       - Input Forms
 *     summary: Create an input form record
 *     description: Creates a new input form record for a client.
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *         example: referral
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/InputForm"
 *     responses:
 *       201:
 *         description: Input form record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InputForm"
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/:form/:childId", controller.create);

/**
 * @swagger
 * /api/input-forms/{form}/{childId}/{id}:
 *   put:
 *     tags:
 *       - Input Forms
 *     summary: Update an input form record
 *     description: Updates an existing input form record for a client.
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *         example: referral
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/InputForm"
 *     responses:
 *       200:
 *         description: Input form record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InputForm"
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.put("/:form/:childId/:id", controller.update);

/**
 * @swagger
 * /api/input-forms/{form}/{childId}/{id}:
 *   delete:
 *     tags:
 *       - Input Forms
 *     summary: Delete an input form record
 *     description: Deletes an existing input form record for a client.
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *         example: referral
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Input form record deleted successfully
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.delete("/:form/:childId/:id", controller.remove);

export default router;