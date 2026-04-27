const multer = require('multer');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({
      success: false,
      error: { message: tooBig ? 'Image too large (max 5MB)' : err.message },
    });
  }
  if (err && err.name === 'Error' && err.message && /Only JPEG, PNG, and WebP/.test(err.message)) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }

  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v.message]));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue).join(', ')}`;
    details = err.keyValue;
  }

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } });
}

module.exports = { notFound, errorHandler };
