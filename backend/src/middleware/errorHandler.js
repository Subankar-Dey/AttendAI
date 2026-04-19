export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ status: 'error', message: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ status: 'error', message: `${field} already exists.` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ status: 'error', message: 'Invalid ID format.' });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }

  res.status(500).json({ status: 'error', message: 'Internal server error.' });
};

export default errorHandler;