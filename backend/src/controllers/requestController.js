import { sendEmail } from '../utils/mailer.js';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';

// CREATE REQUEST
export const createRequest = async (req, res) => {
  const request = await Request.create({
    ...req.body,
    requestedBy: req.user._id
  });
  res.status(201).json({
    status: 'success',
    data: request
  });
};

// GET REQUESTS
export const getRequests = async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  
  // If not admin/staff, only see their own requests
  if (req.user.role === 'student') {
    filter.requestedBy = req.user._id;
  }

  const requests = await Request.find(filter)
    .populate('requestedBy', 'name email rollNumber')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    data: requests
  });
};

// APPROVE REQUEST
export const approveRequest = async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Request already processed' });
  }
  if (request.type === 'STUDENT_CREATE') {
    await User.create(request.data);
  }
  
  if (request.type === 'ATTENDANCE_CORRECTION') {
    const { attendanceId, status, date } = request.data;
    
    if (attendanceId) {
      await Attendance.findByIdAndUpdate(attendanceId, { status: status || 'present' });
    } else if (date) {
      // Find by student and date if specific ID is missing
      const startDate = new Date(date);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(date);
      endDate.setHours(23,59,59,999);
      
      await Attendance.findOneAndUpdate(
        { student: request.requestedBy, date: { $gte: startDate, $lte: endDate } },
        { status: status || 'present' },
        { upsert: false }
      );
    }
  }

  request.status = 'approved';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  // Send notification to requester
  await Notification.create({
    title: 'Request Approved',
    message: `Your request (${request.type}) has been approved.`,
    recipient: request.requestedBy,
    type: 'in-app',
    sentBy: req.user._id
  });
  if (global._io) {
    global._io.emit('notification', {
      userId: request.requestedBy.toString(),
      title: 'Request Approved',
      message: `Your request (${request.type}) has been approved.`
    });
  }
  // Email alert
  const user = await User.findById(request.requestedBy);
  if (user?.email) {
    await sendEmail(user.email, 'Request Approved', `Your request (${request.type}) has been approved.`);
  }
  res.json({ status: 'approved', data: request });
};

// REJECT REQUEST
export const rejectRequest = async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Request already processed' });
  }
  request.status = 'rejected';
  request.adminNote = req.body.note;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  // Send notification to requester
  await Notification.create({
    title: 'Request Rejected',
    message: `Your request (${request.type}) was rejected.`,
    recipient: request.requestedBy,
    type: 'in-app',
    sentBy: req.user._id
  });
  if (global._io) {
    global._io.emit('notification', {
      userId: request.requestedBy.toString(),
      title: 'Request Rejected',
      message: `Your request (${request.type}) was rejected.`
    });
  }
  // Email alert
  const user = await User.findById(request.requestedBy);
  if (user?.email) {
    await sendEmail(user.email, 'Request Rejected', `Your request (${request.type}) was rejected.`);
  }
  res.json({ status: 'rejected', data: request });
};
