import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logAction from '../middleware/auditLogger.js';

export const markAttendance = catchAsync(async (req, res, next) => {
  const { attendance } = req.body;

  if (!Array.isArray(attendance) || attendance.length === 0) {
    return next(new AppError('Attendance array is required.', 400));
  }

  const results = [];
  for (const entry of attendance) {
    const { student, class: classId, subject, date, status } = entry;

    const existing = await Attendance.findOne({ student, date: new Date(date) });
    if (existing) {
      existing.status = status;
      existing.markedBy = req.user._id;
      await existing.save();
      results.push(existing);
    } else {
      const newEntry = await Attendance.create({
        student,
        class: classId,
        subject,
        date: new Date(date),
        status,
        markedBy: req.user._id
      });
      results.push(newEntry);
    }
  }

  await logAction('MARK_ATTENDANCE', 'Attendance', null, req.user._id, { count: results.length }, req);

  res.status(201).json({ status: 'success', message: 'Attendance marked.', data: { results } });
});

export const getAttendance = catchAsync(async (req, res, next) => {
  const { student, class: classId, subject, startDate, endDate, status, page = 1, limit = 50 } = req.query;

  const query = {};
  if (student) query.student = student;
  if (classId) query.class = classId;
  if (subject) query.subject = subject;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const total = await Attendance.countDocuments(query);
  const records = await Attendance.find(query)
    .populate('student', 'name email rollNumber')
    .populate('class', 'name')
    .populate('subject', 'name code')
    .populate('markedBy', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ date: -1 });

  res.json({
    status: 'success',
    data: { records, total, page: Number(page), pages: Math.ceil(total / limit) }
  });
});

export const getAbsentees = catchAsync(async (req, res, next) => {
  const { date, type, class: classId } = req.query;

  if (!date) return next(new AppError('Date is required.', 400));

  const query = { date: new Date(date), status: 'absent' };
  if (classId) query.class = classId;

  const records = await Attendance.find(query)
    .populate('student', 'name email role class')
    .populate('class', 'name department');

  let absentees = records.map(r => r.student).filter(Boolean);

  if (type && type !== 'all') {
    absentees = absentees.filter(s => s.role === type);
  }

  res.json({ status: 'success', data: { absentees, date } });
});

export const getLowAttendance = catchAsync(async (req, res, next) => {
  const { threshold = 75, class: classId, department } = req.query;

  const query = { role: 'student', isActive: true };
  if (classId) query.class = classId;
  if (department) query.department = department;

  const students = await User.find(query).populate('class', 'name department');

  const totalWorkingDays = 100;
  const defaulters = [];

  for (const student of students) {
    const presentDays = await Attendance.countDocuments({
      student: student._id,
      status: 'present'
    });

    const percentage = (presentDays / totalWorkingDays) * 100;
    if (percentage < Number(threshold)) {
      let severity = 'warning';
      if (percentage < 50) severity = 'critical';
      else if (percentage < 65) severity = 'high';

      defaulters.push({
        student,
        percentage: percentage.toFixed(1),
        presentDays,
        totalWorkingDays,
        severity
      });
    }
  }

  res.json({ status: 'success', data: { defaulters } });
});

export const getStudentAttendance = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = { student: req.params.studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(query)
    .populate('class', 'name')
    .populate('subject', 'name')
    .sort({ date: -1 });

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const percentage = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0;

  res.json({
    status: 'success',
    data: { records, stats: { total, present, absent, late, percentage } }
  });
});

export const getAttendanceLogs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;

  const logs = await AuditLog.find({ entity: 'Attendance' })
    .populate('user', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ status: 'success', data: { logs } });
});