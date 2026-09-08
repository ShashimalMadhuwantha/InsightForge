const entitlementService = require('./entitlement.service');

/**
 * Express middleware to enforce a numerical resource limit (e.g. sub-users, data sources, file size)
 *
 * @param {string} resourceType - 'sub_users' | 'data_sources' | 'file_size_mb'
 * @param {function|number} [countExtractor=1] - Extracts requested count from req, or static number
 */
function requireLimit(resourceType, countExtractor = 1) {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant context missing.' });
      }

      const requestedCount = typeof countExtractor === 'function' ? countExtractor(req) : countExtractor;
      await entitlementService.assertLimit(tenantId, resourceType, requestedCount);
      next();
    } catch (err) {
      if (err.code === 'QUOTA_EXCEEDED') {
        return res.status(403).json({
          success: false,
          code: 'QUOTA_EXCEEDED',
          message: err.message,
          details: err.details,
        });
      }
      next(err);
    }
  };
}

/**
 * Express middleware to enforce feature entitlement (e.g. cleansing operation, widget type, insight depth)
 *
 * @param {string} featureType - 'cleansing_op' | 'widget_type' | 'insight_depth'
 * @param {function|string} valueExtractor - Extracts feature value from req, or static string
 */
function requireFeature(featureType, valueExtractor) {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Tenant context missing.' });
      }

      const featureValue = typeof valueExtractor === 'function' ? valueExtractor(req) : valueExtractor;
      await entitlementService.assertFeature(tenantId, featureType, featureValue);
      next();
    } catch (err) {
      if (err.code === 'FEATURE_NOT_INCLUDED') {
        return res.status(403).json({
          success: false,
          code: 'FEATURE_NOT_INCLUDED',
          message: err.message,
          details: err.details,
        });
      }
      next(err);
    }
  };
}

module.exports = {
  requireLimit,
  requireFeature,
};
