import express from 'express';
import {
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.post('/', authenticate, createRequest);
router.get('/', authenticate, requireRole('admin'), getRequests);
router.put('/:id/approve', authenticate, requireRole('admin'), approveRequest);
router.put('/:id/reject', authenticate, requireRole('admin'), rejectRequest);

export default router;
