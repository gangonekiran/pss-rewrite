import { Router } from "express";

import * as c from "./client.controller";

const router = Router();

/**
 * @swagger
 * /api/clients:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get all clients
 *     description: Returns all clients.
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Client"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/", c.getAllClients);

/**
 * @swagger
 * /api/clients/search/lastname:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Search clients by last name
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         example: Smith
 *     responses:
 *       200:
 *         description: Matching clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Client"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/search/lastname", c.searchLastName);

/**
 * @swagger
 * /api/clients/search/firstname:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Search clients by first name
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         example: John
 *     responses:
 *       200:
 *         description: Matching clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Client"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/search/firstname", c.searchFirstName);

/**
 * @swagger
 * /api/clients/search/ssn:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Search clients by SSN
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         example: "123-45-6789"
 *     responses:
 *       200:
 *         description: Matching clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Client"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/search/ssn", c.searchSSN);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Client"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:id", c.getClient);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Create a client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Client"
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Client"
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/", c.createClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Update a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Client"
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Client"
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.put("/:id", c.updateClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     tags:
 *       - Clients
 *     summary: Delete a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.delete("/:id", c.deleteClient);

/**
 * @swagger
 * /api/clients/{id}/status:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-26"
 *     responses:
 *       200:
 *         description: Client status
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:id/status", c.getClientStatus);

/**
 * @swagger
 * /api/clients/{id}/service-history:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client service history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-26"
 *     responses:
 *       200:
 *         description: Client service history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:id/service-history", c.getServiceHistory);

export default router;
