import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Too many attempts. Please try again after 15 minutes.' }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { status: 'error', message: 'Too many requests. Please slow down.' }
});

export default { authLimiter, apiLimiter };