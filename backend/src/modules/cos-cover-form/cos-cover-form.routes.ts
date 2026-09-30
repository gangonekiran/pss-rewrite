import { Router } from 'express';
import * as controller from './cos-cover-form.controller';

const router = Router();

router.get('/:childId', controller.get);
router.post('/:childId', controller.create);
router.get('/:childId/:id', controller.getOne);
router.put('/:childId/:id', controller.update);
router.delete('/:childId/:id', controller.remove);

export default router;
