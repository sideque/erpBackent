// AUTH MIDDLEWARE — DEMO MODE (all checks bypassed)
// For production, restore JWT verification.

function auth(req, _res, next) {
  // Attach a default demo super-admin user so req.user is always populated
  req.user = { id: 'demo', role: 'SUPER_ADMIN', email: 'admin@vantus.com', name: 'Demo Admin' };
  next();
}

function requireRole(..._roles) {
  // All roles allowed in demo mode
  return (_req, _res, next) => next();
}

module.exports = { auth, requireRole };
