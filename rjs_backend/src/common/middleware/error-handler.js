import { AppError } from '../errors/app-error.js';

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} was not found` },
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  req.log?.error({ err: error }, 'request failed');
  const uploadTooLarge = error?.code === 'LIMIT_FILE_SIZE';
  const known = error instanceof AppError;
  const statusCode = uploadTooLarge ? 422 : known ? error.statusCode : 500;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: uploadTooLarge ? 'FILE_TOO_LARGE' : known ? error.code : 'INTERNAL_SERVER_ERROR',
      message: uploadTooLarge ? 'The selected file must be 8 MB or smaller' : known ? error.message : 'An unexpected error occurred',
      ...(known && error.details ? { details: error.details } : {}),
    },
  });
}

export { notFoundHandler, errorHandler };
