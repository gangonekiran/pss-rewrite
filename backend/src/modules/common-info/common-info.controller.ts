import type { Request, Response, NextFunction } from 'express';
import * as service from './common-info.service';

export const regions = async (_r: Request, s: Response) =>
  s.json(await service.lookups.regions());