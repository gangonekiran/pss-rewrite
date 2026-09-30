import type { Request, Response } from 'express';
import * as service from './cos-cover-form.service';

export const get = async (req: Request, res: Response) =>
  res.json(await service.get(req.params.childId));

export const getOne = async (req: Request, res: Response) =>
  res.json(await service.getOne(req.params.childId, req.params.id));

export const create = async (req: Request, res: Response) =>
  res.status(201).json(await service.create(req.params.childId, req.body ?? {}));

export const update = async (req: Request, res: Response) =>
  res.json(await service.update(req.params.childId, req.params.id, req.body ?? {}));

export const remove = async (req: Request, res: Response) =>
  res.json(await service.remove(req.params.childId, req.params.id));
