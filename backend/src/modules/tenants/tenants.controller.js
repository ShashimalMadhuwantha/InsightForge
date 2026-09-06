const tenantsService = require('./tenants.service');

async function getProfile(req, res, next) {
  try {
    const tenantId = req.tenantId || req.user.tenant_id;
    const details = await tenantsService.getTenantDetails(tenantId);
    res.status(200).json({
      status: 'success',
      data: details,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const tenantId = req.tenantId || req.user.tenant_id;
    const updated = await tenantsService.updateTenantProfile(tenantId, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Tenant profile updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
