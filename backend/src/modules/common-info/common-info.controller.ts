import type { Request, Response } from 'express';
import * as service from './common-info.service';

export const regions = async (_r: Request, s: Response) =>
  s.json(await service.lookups.regions());

export const towns = async (r: Request, s: Response) =>
  s.json(
    await service.lookups.towns(
      typeof r.query.search === 'string' ? r.query.search : undefined,
    ),
  );
