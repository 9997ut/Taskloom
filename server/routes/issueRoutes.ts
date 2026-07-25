import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import validate from '../middleware/validate.js';
import {
  listIssues,
  createIssue,
  getIssue,
  updateIssue,
  deleteIssue,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from '../controllers/issueController.js';
import { createIssueSchema, updateIssueSchema, createSubtaskSchema, updateSubtaskSchema } from '../../shared/schemas/issue.js';

const router = Router();

router.use(requireAuth);

router.get('/', listIssues);
router.post('/', validate(createIssueSchema), createIssue);
router.get('/:id', getIssue);
router.patch('/:id', validate(updateIssueSchema), updateIssue);
router.delete('/:id', deleteIssue);

router.post('/:id/subtasks', validate(createSubtaskSchema), createSubtask);
router.patch('/:id/subtasks/:subtaskId', validate(updateSubtaskSchema), updateSubtask);
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);

export default router;
