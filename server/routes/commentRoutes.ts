import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import validate from '../middleware/validate.js';
import { listComments, createComment, deleteComment } from '../controllers/commentController.js';
import { createCommentSchema } from '../../shared/schemas/comment.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', listComments);
router.post('/', validate(createCommentSchema), createComment);
router.delete('/:commentId', deleteComment);

export default router;
