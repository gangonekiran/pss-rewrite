import { Router } from 'express';
import * as controller from './common-info.controller';

const router = Router();

/**
 * @swagger
 * /api/common-info/regions:
 *   get:
 *     tags:
 *       - Common Info
 *     summary: Get all reporting regions
 *     description: Returns active reporting regions (stblReportingRegion), ordered by name.
 *     responses:
 *       200:
 *         description: List of reporting regions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID:
 *                     type: integer
 *                     example: 1
 *                   RName:
 *                     type: string
 *                     example: Burlington
 *                   Description:
 *                     type: string
 *                     nullable: true
 *                     example: Chittenden
 *                   Inactive:
 *                     type: boolean
 *                     nullable: true
 *                     example: false
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get('/regions', controller.regions);

/**
 * @swagger
 * /api/common-info/towns:
 *   get:
 *     tags:
 *       - Common Info
 *     summary: Get towns
 *     description: Returns towns (slstTownCodes) with their county, ordered by town name.
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         description: Partial town code or town name
 *         schema:
 *           type: string
 *         example: burl
 *     responses:
 *       200:
 *         description: List of towns
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Town:
 *                     type: string
 *                   TownName:
 *                     type: string
 *                   SU_id:
 *                     type: integer
 *                     nullable: true
 *                   CountyCode:
 *                     type: string
 *                     nullable: true
 *                   CountyName:
 *                     type: string
 *                     nullable: true
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get('/towns', controller.towns);

export default router;
