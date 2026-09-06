const adminService = require('./admin.service');

class AdminController {
  async getAllTenants(req, res, next) {
    try {
      const result = await adminService.getAllTenants(req.query);
      return res.status(200).json({
        status: 'success',
        data: result.tenants,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTenantDetails(req, res, next) {
    try {
      const tenant = await adminService.getTenantDetails(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTenantStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await adminService.updateTenantStatus(
        req.params.id,
        { status, reason },
        req.user,
        ipAddress
      );
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async overrideTenantPackage(req, res, next) {
    try {
      const { packageId, reason } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await adminService.overrideTenantPackage(
        req.params.id,
        { packageId, reason },
        req.user,
        ipAddress
      );
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getGlobalAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getGlobalAnalytics();
      return res.status(200).json({
        status: 'success',
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const result = await adminService.getAuditLogs(req.query);
      return res.status(200).json({
        status: 'success',
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
