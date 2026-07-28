import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import validate from '../middleware/validate.js';
import { listSavedViews, createSavedView, deleteSavedView } from '../controllers/savedViewController.js';
import { createSavedViewSchema } from '../../shared/schemas/savedView.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSavedViews);
router.post('/', validate(createSavedViewSchema), createSavedView);
router.delete('/:id', deleteSavedView);

export default router;
