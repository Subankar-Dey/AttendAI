import Subject from '../models/Subject.js';
import catchAsync from '../utils/catchAsync.js';

export const getAll = catchAsync(async (req, res, next) => {
  const { class: classId, teacher } = req.query;
  const query = {};
  if (classId) query.class = classId;
  if (teacher) query.teacher = teacher;

  const subjects = await Subject.find(query)
    .populate('class', 'name')
    .populate('teacher', 'name email')
    .sort({ name: 1 });

  res.json({ status: 'success', data: { subjects } });
});

export const getById = catchAsync(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id)
    .populate('class', 'name')
    .populate('teacher', 'name email');

  if (!subject) return res.status(404).json({ status: 'error', message: 'Subject not found.' });
  res.json({ status: 'success', data: { subject } });
});

export const create = catchAsync(async (req, res, next) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ status: 'success', data: { subject } });
});

export const update = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('class', 'name')
    .populate('teacher', 'name email');

  if (!subject) return res.status(404).json({ status: 'error', message: 'Subject not found.' });
  res.json({ status: 'success', data: { subject } });
});

export const remove = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ status: 'error', message: 'Subject not found.' });
  res.json({ status: 'success', message: 'Subject deleted.' });
});