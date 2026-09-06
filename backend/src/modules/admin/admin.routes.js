const express = require('express');
const adminController = require('./admin.controller');
const { authenticate, requireSuperAdmin } = require('../../common/middlewares/auth');

const router = express.Router();

// All admin routes require valid authentication and super_admin role
router.use(authenticate, requireSuperAdmin);

router.get('/tenants', (req, res, next) => adminController.getAllTenants(req, res, next));
router.get('/tenants/:id', (req, res, next) => adminController.getTenantDetails(req, res, next));
router.patch('/tenants/:id/status', (req, res, next) => adminController.updateTenantStatus(req, res, next));
router.patch('/tenants/:id/package', (req, res, next) => adminController.overrideTenantPackage(req, res, next));

router.get('/analytics/overview', (req, res, next) => adminController.getGlobalAnalytics(req, res, next));
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

module.exports = router;
