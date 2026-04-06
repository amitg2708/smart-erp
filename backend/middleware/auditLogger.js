const AuditLog = require('../models/AuditLog');

/**
 * Middleware that auto-logs mutating requests (POST, PUT, PATCH, DELETE)
 * Attach after protect middleware so req.user is available.
 */
const auditLogger = (entity) => {
  return (req, res, next) => {
    // Only log mutating methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }
    const originalSend = res.json.bind(res);
    res.json = (body) => {
      const action = {
        POST: 'CREATE',
        PUT: 'UPDATE',
        PATCH: 'UPDATE',
        DELETE: 'DELETE',
      }[req.method];

      // Fire and forget — don't block response
      AuditLog.create({
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action,
        entity,
        entityId: req.params?.id || body?._id || body?.fee?._id,
        details: req.method !== 'DELETE' ? req.body : undefined,
        ip: req.ip || req.headers['x-forwarded-for'],
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      }).catch(() => {}); // Silent fail — never break main flow

      return originalSend(body);
    };
    next();
  };
};

module.exports = auditLogger;
