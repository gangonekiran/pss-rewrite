import * as repo from "./input-form.repository";

import type {
  FormName,
  InputFormRecord,
} from "./input-form.types";

/**
 * Validates the ChildID and, when supplied, the form record ID.
 *
 * ChildID and form ID must be positive integers.
 *
 * Throws an error with an HTTP status code so that the
 * global error middleware can return the appropriate response.
 */
function validate(childId: number, id?: number): void {
  // ChildID is required and must be a positive integer.
  if (!Number.isInteger(childId) || childId <= 0) {
    throw Object.assign(
      new Error("Invalid ChildID"),
      { status: 400 },
    );
  }

  // Form ID is required for getOne, update, and delete.
  if (
    id !== undefined &&
    (!Number.isInteger(id) || id <= 0)
  ) {
    throw Object.assign(
      new Error("Invalid form ID"),
      { status: 400 },
    );
  }
}

/**
 * Retrieves all records for a specific form and client.
 *
 * Example:
 * getByChildId("referral", 1)
 */
export const getByChildId = (
  f: FormName,
  c: number,
) => {
  validate(c);

  return repo.findByChildId(f, c);
};

/**
 * Retrieves one specific form record for a client.
 *
 * Throws 404 when the requested record does not exist.
 */
export const getOne = async (
  f: FormName,
  c: number,
  id: number,
) => {
  validate(c, id);

  const r = await repo.findOne(f, c, id);

  if (!r) {
    throw Object.assign(
      new Error("Form record not found"),
      { status: 404 },
    );
  }

  return r;
};

/**
 * Creates a new input-form record for a client.
 *
 * The repository is responsible for inserting the record
 * into the database using the form configuration.
 */
export const create = (
  f: FormName,
  c: number,
  p: InputFormRecord,
) => {
  validate(c);

  return repo.insert(f, c, p);
};

/**
 * Updates an existing input-form record.
 *
 * Throws 404 when the requested record does not exist.
 */
export const update = async (
  f: FormName,
  c: number,
  id: number,
  p: InputFormRecord,
) => {
  validate(c, id);

  const r = await repo.update(f, c, id, p);

  if (!r) {
    throw Object.assign(
      new Error("Form record not found"),
      { status: 404 },
    );
  }

  return r;
};

/**
 * Deletes an existing input-form record.
 *
 * The repository returns true when a record was deleted.
 * If no record was deleted, the requested record does not exist.
 */
export const remove = async (
  f: FormName,
  c: number,
  id: number,
) => {
  validate(c, id);

  const deleted = await repo.remove(f, c, id);

  if (!deleted) {
    throw Object.assign(
      new Error("Form record not found"),
      { status: 404 },
    );
  }

  return {
    deleted: true,
  };
};