import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

export const dailyReport = catchAsync(async (req, res, next) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const records = await Attendance.find({
    date: { $gte: targetDate, $lt: nextDate }
  }).populate('student', 'name rollNumber class')
    .populate('class', 'name');

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;

  res.json({
    status: 'success',
    data: {
      date: targetDate.toISOString().split('T')[0],
      total: records.length,
      present,
      absent,
      late,
      records
    }
  });
});

export const monthlyReport = catchAsync(async (req, res, next) => {
  const { month, year } = req.query;
  const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
  const targetYear = year ? Number(year) : new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const records = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate('student', 'name rollNumber class')
    .populate('class', 'name');

  const classWise = {};
  records.forEach(r => {
    const className = r.class?.name || 'Unknown';
    if (!classWise[className]) classWise[className] = { present: 0, absent: 0, late: 0 };
    if (r.status === 'present') classWise[className].present++;
    else if (r.status === 'absent') classWise[className].absent++;
    else classWise[className].late++;
  });

  res.json({
    status: 'success',
    data: {
      month: targetMonth + 1,
      year: targetYear,
      total: records.length,
      classWise
    }
  });
});

export const classReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const query = { class: req.params.classId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(query)
    .populate('student', 'name rollNumber')
    .populate('subject', 'name');

  const studentWise = {};
  records.forEach(r => {
    const sid = r.student._id.toString();
    if (!studentWise[sid]) {
      studentWise[sid] = { student: r.student, present: 0, absent: 0, late: 0 };
    }
    if (r.status === 'present') studentWise[sid].present++;
    else if (r.status === 'absent') studentWise[sid].absent++;
    else studentWise[sid].late++;
  });

  res.json({ status: 'success', data: { studentWise: Object.values(studentWise) } });
});