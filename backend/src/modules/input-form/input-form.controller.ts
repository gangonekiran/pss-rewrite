import type { Request, Response } from "express";

import * as service from "./input-form.service";

import type { FormName } from "./input-form.types";

/**
 * Extracts and casts the form name from the route parameters.
 *
 * The form name is used to determine which form configuration
 * and database table should be used by the service layer.
 */
const f = (r: Request) => r.params.form as FormName;

/**
 * Extracts the Child ID from the route parameters.
 *
 * Route parameters are strings by default, so the value is
 * converted to a number before being passed to the service layer.
 */
const c = (r: Request) => Number(r.params.childId);

/**
 * Extracts the form record ID from the route parameters.
 *
 * The ID is converted from the route parameter string to a number.
 */
const id = (r: Request) => Number(r.params.id);

/**
 * Retrieves all input-form records for a specific child.
 *
 * Delegates the database/business logic to the service layer
 * and returns the resulting records as JSON.
 */
export const getByChildId = async (r: Request, s: Response) =>
  s.json(await service.getByChildId(f(r), c(r)));

/**
 * Retrieves a single input-form record for a specific child.
 *
 * Uses the form name, Child ID, and record ID to identify
 * the requested form record.
 */
export const getOne = async (r: Request, s: Response) =>
  s.json(await service.getOne(f(r), c(r), id(r)));

/**
 * Creates a new input-form record for a specific child.
 *
 * The request body contains the form data. If no body is supplied,
 * an empty object is passed to the service layer.
 *
 * Returns HTTP 201 (Created) when the record is successfully created.
 */
export const create = async (r: Request, s: Response) =>
  s.status(201).json(await service.create(f(r), c(r), r.body ?? {}));

/**
 * Updates an existing input-form record.
 *
 * Identifies the record using the form name, Child ID, and record ID,
 * and passes the submitted fields to the service layer.
 */
export const update = async (r: Request, s: Response) =>
  s.json(await service.update(f(r), c(r), id(r), r.body ?? {}));

/**
 * Deletes an existing input-form record.
 *
 * Identifies the record using the form name, Child ID, and record ID,
 * then delegates the delete operation to the service layer.
 */
export const remove = async (r: Request, s: Response) =>
  s.json(await service.remove(f(r), c(r), id(r)));