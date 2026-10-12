const { z } = require('zod');

const requestShapeSchemas = {
  body: z.record(z.string(), z.unknown()),
  query: z.record(z.string(), z.string()),
  params: z.record(z.string(), z.string()),
};

const validateRequest = (schemas) => (req, res, next) => {
  for (const [part, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: `Invalid request ${part}`,
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    if (part === 'body') req.body = result.data;
  }
  next();
};

const validateRequestShape = validateRequest(requestShapeSchemas);

module.exports = { validateRequest, validateRequestShape };
