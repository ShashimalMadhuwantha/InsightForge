const { db } = require('../../common/config/db');

class TenantsService {
  async getTenantDetails(tenantId) {
    const tenant = await db('tenants')
      .leftJoin('packages', 'tenants.package_id', 'packages.id')
      .where('tenants.id', tenantId)
      .select(
        'tenants.id',
        'tenants.name',
        'tenants.status',
        'tenants.contact_email',
        'tenants.contact_phone',
        'tenants.logo_url',
        'tenants.created_at',
        'packages.id as package_id',
        'packages.name as package_name',
        'packages.tier as package_tier',
        'packages.limits as package_limits'
      )
      .first();

    if (!tenant) {
      const error = new Error('Tenant workspace not found');
      error.statusCode = 404;
      throw error;
    }

    const userCount = await db('users')
      .where({ tenant_id: tenantId })
      .count('id as count')
      .first();

    return {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      contactEmail: tenant.contact_email,
      contactPhone: tenant.contact_phone,
      logoUrl: tenant.logo_url,
      createdAt: tenant.created_at,
      userCount: parseInt(userCount?.count || 0, 10),
      package: {
        id: tenant.package_id,
        name: tenant.package_name,
        tier: tenant.package_tier,
        limits: typeof tenant.package_limits === 'string' ? JSON.parse(tenant.package_limits) : tenant.package_limits,
      },
    };
  }

  async updateTenantProfile(tenantId, { name, contactEmail, contactPhone, logoUrl }) {
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (contactEmail !== undefined) updateData.contact_email = contactEmail?.trim() || null;
    if (contactPhone !== undefined) updateData.contact_phone = contactPhone?.trim() || null;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl?.trim() || null;
    updateData.updated_at = new Date();

    await db('tenants').where({ id: tenantId }).update(updateData);
    return this.getTenantDetails(tenantId);
  }
}

module.exports = new TenantsService();
