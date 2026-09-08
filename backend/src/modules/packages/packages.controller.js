const packagesService = require('./packages.service');
const entitlementService = require('./entitlement.service');

class PackagesController {
  async getAllPackages(req, res, next) {
    try {
      const data = await packagesService.getAllPackages();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getPackageById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await packagesService.getPackageById(id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getMyPlan(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const report = await entitlementService.getQuotaReport(tenantId);
      return res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async changePlan(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { packageId } = req.body;
      if (!packageId) {
        return res.status(400).json({ success: false, message: 'packageId is required' });
      }

      const result = await packagesService.assignTenantPackage(tenantId, packageId, req.user);
      return res.status(200).json({
        success: true,
        message: `Plan successfully updated to ${result.package.name}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async createCheckoutSession(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { packageId, billingInterval } = req.body;
      if (!packageId) {
        return res.status(400).json({ success: false, message: 'packageId is required' });
      }

      const session = await packagesService.createCheckoutSession(
        tenantId,
        packageId,
        req.user,
        billingInterval || 'monthly'
      );
      return res.status(200).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const event = req.body;
      const result = await packagesService.handleWebhook(event);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PackagesController();
