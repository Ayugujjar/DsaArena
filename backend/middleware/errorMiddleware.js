const notFound = (req, res, next) => {
  const error = new Error('Resource not found');
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const proposedStatus = res.statusCode !== 200 ? res.statusCode : err.status || err.statusCode;
  const statusCode = Number.isInteger(proposedStatus) && proposedStatus >= 400 && proposedStatus <= 599
    ? proposedStatus
    : 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const isClientError = statusCode >= 400 && statusCode < 500;
  const clientMessage = statusCode === 413
    ? 'Request payload is too large'
    : statusCode === 400 && err.type === 'entity.parse.failed'
      ? 'Request body contains invalid JSON'
      : err.message || 'Request failed';

  if (statusCode >= 500) {
    console.error(JSON.stringify({
      event: 'request_failed',
      method: req.method,
      path: req.path,
      statusCode,
      error: err.name || 'Error',
      ...(isProduction ? {} : { stack: err.stack }),
    }));
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && !isClientError ? 'Internal Server Error' : clientMessage,
    ...(!isProduction && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
