import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Department from '../models/Department.js';
import Class from '../models/Class.js';
import catchAsync from '../utils/catchAsync.js';

export const getStats = catchAsync(async (req, res, next) => {
  const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
  const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
  const totalDepartments = await Department.countDocuments();
  const totalClasses = await Class.countDocuments();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAbsentees = await Attendance.countDocuments({
    date: today,
    status: 'absent'
  });

  const todayPresent = await Attendance.countDocuments({
    date: today,
    status: 'present'
  });

  res.json({
    status: 'success',
    data: {
      stats: {
        totalStudents,
        totalStaff,
        totalDepartments,
        totalClasses,
        todayAbsentees,
        todayPresent,
        date: today
      }
    }
  });
});

export const getCharts = catchAsync(async (req, res, next) => {
  const { days = 7 } = req.query;

  const absenteesTrend = [];
  const today = new Date();

  for (let i = Number(days) - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const absent = await Attendance.countDocuments({
      date: { $gte: date, $lt: nextDate },
      status: 'absent'
    });

    absenteesTrend.push({
      date: date.toISOString().split('T')[0],
      absent
    });
  }

  const departmentWise = await Class.aggregate([
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'dept'
      }
    },
    { $unwind: '$dept' },
    {
      $group: {
        _id: '$dept.name',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    status: 'success',
    data: { absenteesTrend, departmentWise }
  });
});