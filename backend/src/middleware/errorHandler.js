export function errorHandler(err, req, res, _next) {
  req.log.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error'
  });
}
