const { verifyAccessToken } = require('../utils/token');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication token required (Bearer <token>)',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token',
    });
  }

  req.user = {
    id: decoded.id,
    tenant_id: decoded.tenantId,
    email: decoded.email,
    role: decoded.role,
  };
  req.tenantId = decoded.tenantId;

  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Insufficient role permissions for this operation',
      });
    }
    next();
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Super Admin privileges required',
    });
  }
  next();
}

module.exports = {
  authenticate,
  requireRole,
  requireSuperAdmin,
};
