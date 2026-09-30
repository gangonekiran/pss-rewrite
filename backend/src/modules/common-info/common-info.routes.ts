import { Router } from 'express';
import * as controller from './common-info.controller';

const router = Router();

router.get('/regions', controller.regions);

export default router;
