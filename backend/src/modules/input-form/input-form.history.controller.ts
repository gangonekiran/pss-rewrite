import type { Request, Response } from 'express';
import { getHistory } from './input-form.history.repository';

export async function history(req: Request, res: Response) {
  const childId = Number(req.params.childId);

  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ChildID',
    });
  }

  const rows = await getHistory(childId);
  return res.json(rows);
}
