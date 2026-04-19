import express from 'express';
import { send, getNotifications, markAsRead, getAnnouncements } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/send', send);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.get('/announcements', getAnnouncements);

export default router;