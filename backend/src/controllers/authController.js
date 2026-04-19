import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, department, class: studentClass } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email and password are required.', 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered.', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    department,
    class: studentClass
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    status: 'success',
    message: 'Registration successful.',
    token,
    data: { user }
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated.', 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401));
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  res.json({
    status: 'success',
    message: 'Login successful.',
    token,
    data: { user }
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name code')
    .populate('class', 'name')
    .populate('classTeacher', 'name email');

  res.json({ status: 'success', data: { user } });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  );

  res.json({ status: 'success', message: 'Profile updated.', data: { user } });
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) {
    return next(new AppError('Invalid or expired verification token.', 400));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({ status: 'success', message: 'Email verified successfully.' });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with that email.', 404));
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  res.json({ status: 'success', message: 'Password reset token sent to email.' });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+password');

  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ status: 'success', message: 'Password reset successful.' });
});