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
router.get('/', authenticate, getRequests);
router.put('/:id/approve', authenticate, requireRole('admin', 'staff'), approveRequest);
router.put('/:id/reject', authenticate, requireRole('admin', 'staff'), rejectRequest);

export default router;
