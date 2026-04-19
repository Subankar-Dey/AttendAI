import Class from '../models/Class.js';
import catchAsync from '../utils/catchAsync.js';

export const getAll = catchAsync(async (req, res, next) => {
  const { department, teacher } = req.query;
  const query = {};
  if (department) query.department = department;
  if (teacher) query.classTeacher = teacher;

  const classes = await Class.find(query)
    .populate('department', 'name code')
    .populate('classTeacher', 'name email')
    .populate('subjects', 'name code')
    .sort({ name: 1 });

  res.json({ status: 'success', data: { classes } });
});

export const getById = catchAsync(async (req, res, next) => {
  const classData = await Class.findById(req.params.id)
    .populate('department', 'name code')
    .populate('classTeacher', 'name email')
    .populate('subjects', 'name code');

  if (!classData) return res.status(404).json({ status: 'error', message: 'Class not found.' });
  res.json({ status: 'success', data: { class: classData } });
});

export const create = catchAsync(async (req, res, next) => {
  const classData = await Class.create(req.body);
  res.status(201).json({ status: 'success', data: { class: classData } });
});

export const update = catchAsync(async (req, res, next) => {
  const classData = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('department', 'name code')
    .populate('classTeacher', 'name email');

  if (!classData) return res.status(404).json({ status: 'error', message: 'Class not found.' });
  res.json({ status: 'success', data: { class: classData } });
});

export const remove = catchAsync(async (req, res, next) => {
  const classData = await Class.findByIdAndDelete(req.params.id);
  if (!classData) return res.status(404).json({ status: 'error', message: 'Class not found.' });
  res.json({ status: 'success', message: 'Class deleted.' });
});