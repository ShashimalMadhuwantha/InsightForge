/**
 * Multi-Tenant Scoping Middleware & Query Helper
 * Enforces strict isolation: every data access query is filtered by tenant_id
 */

function tenantScope(req, res, next) {
  const targetTenantId = req.params?.tenantId || req.headers?.['x-tenant-id'];
  const userTenantId = req.user?.tenant_id;
  const tenantId = targetTenantId || userTenantId;

  if (!tenantId) {
    return res.status(400).json({
      status: 'error',
      message: 'Tenant context is missing or invalid',
    });
  }

  // If user is authenticated and attempts to access another tenant context
  if (userTenantId && targetTenantId && userTenantId !== targetTenantId) {
    return res.status(403).json({
      status: 'error',
      message: 'Cross-tenant access forbidden: Cannot access resources of another tenant',
    });
  }

  req.tenantId = userTenantId || tenantId;
  next();
}

/**
 * Scopes a Knex query builder to the tenant_id
 * @param { import("knex").Knex } knex
 * @param { string } tableName
 * @param { string } tenantId
 */
function scopedQuery(knex, tableName, tenantId) {
  if (!tenantId) {
    throw new Error('Tenant ID is required for scoped database operations');
  }
  return knex(tableName).where({ tenant_id: tenantId });
}

module.exports = {
  tenantScope,
  scopedQuery,
};
