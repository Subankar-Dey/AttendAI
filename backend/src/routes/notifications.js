import express from 'express';
import {
  send,
  getSent,
  getNotifications,
  markAsRead,
  getAnnouncements,
  updateNotification,
  deleteNotification
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

// Admin: send, view sent, edit, delete
router.post('/send',            requireRole('admin', 'staff'), send);
router.get('/sent',             requireRole('admin', 'staff'), getSent);
router.put('/:id',              requireRole('admin', 'staff'), updateNotification);
router.delete('/:id',           requireRole('admin', 'staff'), deleteNotification);

// All users
router.get('/',                 getNotifications);
router.put('/:id/read',         markAsRead);
router.get('/announcements',    getAnnouncements);

export default router;