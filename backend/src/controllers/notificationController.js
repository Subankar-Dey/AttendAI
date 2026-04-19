import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';

export const send = catchAsync(async (req, res, next) => {
  const { title, message, type, recipient, recipients, priority } = req.body;

  const notification = await Notification.create({
    title,
    message,
    type: type || 'in-app',
    recipient,
    recipients,
    sentBy: req.user._id,
    priority: priority || 'normal'
  });

  res.status(201).json({ status: 'success', data: { notification } });
});

export const getNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const query = {
    $or: [
      { recipient: req.user._id },
      { recipients: req.user._id },
      { 'recipients': { $size: 0 } }
    ]
  };

  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .populate('sentBy', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    data: { notifications, total, page: Number(page) }
  });
});

export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ status: 'error', message: 'Not found.' });

  const alreadyRead = notification.readBy.some(r => r.user.toString() === req.user._id.toString());
  if (!alreadyRead) {
    notification.readBy.push({ user: req.user._id, readAt: new Date() });
    await notification.save();
  }

  res.json({ status: 'success', message: 'Marked as read.' });
});

export const getAnnouncements = catchAsync(async (req, res, next) => {
  const announcements = await Notification.find({
    recipients: { $size: 0 }
  }).populate('sentBy', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ status: 'success', data: { announcements } });
});