import express from 'express';
import { predict, analyze, chatbot, ocr, insights } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/predict', predict);
router.post('/analyze', analyze);
router.post('/chat', chatbot);
router.post('/ocr', ocr);
router.get('/insights', insights);

export default router;