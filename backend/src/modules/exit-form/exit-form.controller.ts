import type { Request, Response } from "express";
import * as service from "./exit-form.service";

export const get = async (r: Request, s: Response) =>
  s.json(await service.get(r.params.childId));
export const getOne = async (r: Request, s: Response) =>
  s.json(await service.getOne(r.params.childId, r.params.id));
export const defaults = async (r: Request, s: Response) =>
  s.json(await service.defaults(r.params.childId));
export const create = async (r: Request, s: Response) =>
  s.status(201).json(await service.create(r.params.childId, r.body ?? {}));
export const update = async (r: Request, s: Response) =>
  s.json(await service.update(r.params.childId, r.params.id, r.body ?? {}));
export const remove = async (r: Request, s: Response) =>
  s.json(await service.remove(r.params.childId, r.params.id));
export const options = async (_r: Request, s: Response) =>
  s.json(service.lookups.options());
