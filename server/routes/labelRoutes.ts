import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import validate from '../middleware/validate.js';
import { listLabels, createLabel, updateLabel, deleteLabel } from '../controllers/labelController.js';
import { createLabelSchema, updateLabelSchema } from '../../shared/schemas/label.js';

const router = Router();

router.use(requireAuth);

router.get('/', listLabels);
router.post('/', validate(createLabelSchema), createLabel);
router.patch('/:id', validate(updateLabelSchema), updateLabel);
router.delete('/:id', deleteLabel);

export default router;
