import Department from '../models/Department.js';
import catchAsync from '../utils/catchAsync.js';

export const getAll = catchAsync(async (req, res, next) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ status: 'success', data: { departments } });
});

export const getById = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ status: 'error', message: 'Department not found.' });
  res.json({ status: 'success', data: { department } });
});

export const create = catchAsync(async (req, res, next) => {
  const department = await Department.create(req.body);
  res.status(201).json({ status: 'success', data: { department } });
});

export const update = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) return res.status(404).json({ status: 'error', message: 'Department not found.' });
  res.json({ status: 'success', data: { department } });
});

export const remove = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) return res.status(404).json({ status: 'error', message: 'Department not found.' });
  res.json({ status: 'success', message: 'Department deleted.' });
});