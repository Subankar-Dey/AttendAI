import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', requireRole('admin'), create);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);

export default router;