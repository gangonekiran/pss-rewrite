import type { Request, Response } from 'express';

import { getHistory } from './input-form.history.repository';

/**
 * Retrieves the input-form history for a specific client.
 *
 * The ChildID is taken from the route parameter and validated
 * before the request is passed to the repository layer.
 */
export async function history(req: Request, res: Response) {
  // Convert the ChildID route parameter from string to number.
  const childId = Number(req.params.childId);

  // ChildID must be a positive integer.
  // Reject invalid values before querying the database.
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ChildID',
    });
  }

  // Retrieve all form history records associated with the client.
  const rows = await getHistory(childId);

  // Return the history records as JSON.
  return res.json(rows);
}