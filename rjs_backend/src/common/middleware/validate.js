import { AppError } from '../errors/app-error.js';

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.filter((part) => part !== 'body').join('.'),
        message: issue.message,
        code: issue.code,
      }));
      return next(new AppError(
        422,
        'VALIDATION_ERROR',
        issues[0]?.field
          ? `${issues[0].field}: ${issues[0].message}`
          : 'The request contains invalid data',
        { issues },
      ));
    }
    req.validated = result.data;
    return next();
  };
}

export { validate };
