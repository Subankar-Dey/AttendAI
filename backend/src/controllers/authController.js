/**
 * Authentication Controller
 * Handles user registration, login, and JWT token management
 * 
 * @module authController
 * @requires crypto - For generating secure tokens
 * @requires jsonwebtoken - For JWT token generation and verification
 * @requires ../models/User.js - User data model
 * @requires ../utils/AppError.js - Custom error handling
 * @requires ../utils/catchAsync.js - Async/await wrapper for error handling
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Register a new user
 * Validates input, checks for duplicate email, creates user with hashed password
 * Issues JWT token valid for 7 days by default
 * 
 * @route POST /api/auth/register
 * @param {string} req.body.name - User's full name (required)
 * @param {string} req.body.email - User's email address (required, must be unique)
 * @param {string} req.body.password - User's password (required, bcrypt hashed on save)
 * @param {string} req.body.role - User role: 'admin', 'staff', or 'student' (defaults to 'student')
 * @param {string} req.body.department - Department ID (optional, for students)
 * @param {string} req.body.class - Class ID (optional, for students)
 * @returns {object} {status: 'success', token: JWT, data: {user}}
 * @throws {AppError} 400 - Missing required fields or duplicate email
 * 
 * @example
 * // Request
 * POST /api/auth/register
 * { "name": "John Doe", "email": "john@example.com", "password": "secure123", "role": "student" }
 * // Response
 * { "status": "success", "token": "eyJhbGc...", "data": { "user": {...} } }
 */
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

/**
 * Login user and issue JWT token
 * Validates credentials against database, compares passwords using bcrypt
 * Updates lastLogin timestamp and returns JWT for authenticated requests
 * 
 * @route POST /api/auth/login
 * @param {string} req.body.email - User's registered email
 * @param {string} req.body.password - User's password (compared with bcrypt hash)
 * @returns {object} {status: 'success', token: JWT, data: {user}}
 * @throws {AppError} 400 - Missing credentials
 * @throws {AppError} 401 - Invalid email or password
 * 
 * @example
 * // Request
 * POST /api/auth/login
 * { "email": "john@example.com", "password": "secure123" }
 * // Response
 * { "status": "success", "token": "eyJhbGc...", "data": { "user": {...} } }
 */
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