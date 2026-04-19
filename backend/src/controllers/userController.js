// ADMIN: GET ALL PROFILES (FULL DETAILS)
import mongoose from 'mongoose';
export const getAllProfiles = catchAsync(async (req, res, next) => {
  const users = await User.find()
    .populate('department')
    .populate('class')
    .select('-password');
  res.json({
    status: 'success',
    results: users.length,
    data: users
  });
});
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import logAction from '../middleware/auditLogger.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, role, department, class: classId, search, isActive } = req.query;

  const query = {};
  if (role) query.role = role;
  if (department) query.department = department;
  if (classId) query.class = classId;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } }
    ];
  }
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('department', 'name code')
    .populate('class', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    data: { users, total, page: Number(page), pages: Math.ceil(total / limit) }
  });
});

export const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('department', 'name code')
    .populate('class', 'name');

  if (!user) return next(new AppError('User not found.', 404));

  res.json({ status: 'success', data: { user } });
});

export const createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  await logAction('CREATE', 'User', user._id, req.user._id, { data: req.body }, req);

  res.status(201).json({ status: 'success', data: { user } });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const { password, ...updateData } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  }).populate('department', 'name code').populate('class', 'name');

  if (!user) return next(new AppError('User not found.', 404));

  await logAction('UPDATE', 'User', user._id, req.user._id, { data: updateData }, req);

  res.json({ status: 'success', message: 'User updated.', data: { user } });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!user) return next(new AppError('User not found.', 404));

  await logAction('DELETE', 'User', user._id, req.user._id, {}, req);

  res.json({ status: 'success', message: 'User deactivated.' });
});

export const getStudents = catchAsync(async (req, res, next) => {
  const { class: classId } = req.query;
  const query = { role: 'student' };
  if (classId) query.class = classId;

  const students = await User.find(query).populate('class', 'name department');

  res.json({ status: 'success', data: { students } });
});

export const getStaff = catchAsync(async (req, res, next) => {
  const { department } = req.query;
  const query = { role: 'staff' };
  if (department) query.department = department;

  const staff = await User.find(query).populate('department', 'name code');

  res.json({ status: 'success', data: { staff } });
});