import express from 'express';
import { dailyReport, monthlyReport, classReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

router.get('/daily', dailyReport);
router.get('/monthly', monthlyReport);
router.get('/class/:classId', classReport);

export default router;