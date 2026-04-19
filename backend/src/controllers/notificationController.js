import Notification from '../models/Notification.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/* ── Send / Create ─────────────────────────────── */
export const send = catchAsync(async (req, res, next) => {
  const { title, message, type, target, priority, category } = req.body;

  if (!title?.trim()) return next(new AppError('Title is required.', 400));
  if (!message?.trim()) return next(new AppError('Message is required.', 400));

  // Resolve recipients array based on target
  let recipients = [];
  if (target === 'students') {
    const users = await User.find({ role: 'student', isActive: true }).select('_id');
    recipients = users.map(u => u._id);
  } else if (target === 'staff') {
    const users = await User.find({ role: 'staff', isActive: true }).select('_id');
    recipients = users.map(u => u._id);
  } else if (target === 'individual' && req.body.recipientId) {
    recipients = [req.body.recipientId];
  }
  // 'all' → empty recipients array means broadcast to everyone

  const notification = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    type: type || 'in-app',
    target: target || 'all',
    recipients,
    sentBy: req.user._id,
    priority: priority || 'normal',
    category: category || 'announcement'
  });

  await notification.populate('sentBy', 'name email');

  res.status(201).json({ status: 'success', data: { notification } });
});

/* ── Get all sent (admin view) ─────────────────── */
export const getSent = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;

  const total = await Notification.countDocuments({ sentBy: req.user._id });
  const notifications = await Notification.find({ sentBy: req.user._id })
    .populate('sentBy', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ status: 'success', data: { notifications, total, page: Number(page) } });
});

/* ── Get notifications for current user ────────── */
export const getNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, category = 'announcement' } = req.query;
  const userId = req.user._id;

  // Re-writing query for better precision based on current user role
  const finalQuery = {
    $or: [
      { recipients: userId },
      { target: 'all' }
    ]
  };

  if (category) finalQuery.category = category;
  else finalQuery.category = { $ne: 'request' }; // Default: filter out request outcomes

  if (req.user.role === 'student') finalQuery.$or.push({ target: 'students' });
  if (req.user.role === 'staff' || req.user.role === 'admin') finalQuery.$or.push({ target: 'staff' });

  const total = await Notification.countDocuments(finalQuery);
  const notifications = await Notification.find(finalQuery)
    .populate('sentBy', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  // Attach isRead flag per user
  const result = notifications.map(n => {
    const obj = n.toObject();
    obj.isReadByMe = n.readBy?.some(r => r.user?.toString() === userId.toString()) || false;
    return obj;
  });

  res.json({ status: 'success', data: { notifications: result, total, page: Number(page) } });
});

/* ── Update notification ───────────────────────── */
export const updateNotification = catchAsync(async (req, res, next) => {
  const { title, message, priority } = req.body;
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError('Notification not found.', 404));

  // Only sender or admin can edit
  if (notification.sentBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to edit this notification.', 403));
  }

  if (title) notification.title = title.trim();
  if (message) notification.message = message.trim();
  if (priority) notification.priority = priority;
  await notification.save();
  await notification.populate('sentBy', 'name email');

  res.json({ status: 'success', data: { notification } });
});

/* ── Delete notification ───────────────────────── */
export const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError('Notification not found.', 404));

  if (notification.sentBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this notification.', 403));
  }

  await notification.deleteOne();
  res.json({ status: 'success', message: 'Notification deleted.' });
});

/* ── Mark as read ──────────────────────────────── */
export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError('Notification not found.', 404));

  const alreadyRead = notification.readBy?.some(r => r.user?.toString() === req.user._id.toString());
  if (!alreadyRead) {
    notification.readBy.push({ user: req.user._id, readAt: new Date() });
    await notification.save();
  }
  res.json({ status: 'success', message: 'Marked as read.' });
});

/* ── Get announcements (public broadcast) ──────── */
export const getAnnouncements = catchAsync(async (req, res, next) => {
  const announcements = await Notification.find({ recipients: { $size: 0 } })
    .populate('sentBy', 'name')
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ status: 'success', data: { announcements } });
});