import type { Request, Response } from "express";
import * as service from "./active-form.service";

export const get = async (r: Request, s: Response) =>
  s.json(await service.get(r.params.childId));
export const getOne = async (r: Request, s: Response) =>
  s.json(await service.getOne(r.params.childId, r.params.id));
export const create = async (r: Request, s: Response) =>
  s.status(201).json(await service.create(r.params.childId, r.body ?? {}));
export const update = async (r: Request, s: Response) =>
  s.json(await service.update(r.params.childId, r.params.id, r.body ?? {}));
export const remove = async (r: Request, s: Response) =>
  s.json(await service.remove(r.params.childId, r.params.id));
export const regions = async (_r: Request, s: Response) =>
  s.json(await service.lookups.regions());
export const supervisoryUnions = async (_r: Request, s: Response) =>
  s.json(await service.lookups.supervisoryUnions());
export const towns = async (r: Request, s: Response) =>
  s.json(
    await service.lookups.towns(
      typeof r.query.search === "string" ? r.query.search : undefined,
    ),
  );
export const serviceCoordinatorTypes = async (_r: Request, s: Response) =>
  s.json(await service.lookups.serviceCoordinatorTypes());
export const delayReasons = async (_r: Request, s: Response) =>
  s.json(await service.lookups.delayReasons());
