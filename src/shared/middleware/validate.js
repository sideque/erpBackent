// VALIDATION MIDDLEWARE — DEMO MODE (all validation bypassed)
// For production, restore Zod schema validation.

function validate(_schema, _source = 'body') {
  return (_req, _res, next) => next();
}

module.exports = { validate };
