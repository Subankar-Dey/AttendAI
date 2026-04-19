import express from 'express';
import { getStats, getCharts } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/charts', getCharts);

export default router;