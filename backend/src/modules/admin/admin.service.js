const { randomUUID } = require('crypto');
const { db } = require('../../common/config/db');
const { redis } = require('../../common/config/redis');

class AdminService {
  /**
   * Get all tenants with aggregated counts and filtering
   */
  async getAllTenants({ page = 1, limit = 20, search = '', status = '', packageId = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

    // Base query excluding internal system administrative tenant
    let query = db('tenants')
      .whereNot('tenants.id', SYSTEM_TENANT_ID)
      .leftJoin('packages', 'tenants.package_id', 'packages.id')
      .select(
        'tenants.id',
        'tenants.name',
        'tenants.package_id as packageId',
        'packages.name as packageName',
        'packages.tier as packageTier',
        'tenants.status',
        'tenants.contact_email as contactEmail',
        'tenants.contact_phone as contactPhone',
        'tenants.created_at as createdAt',
        'tenants.updated_at as updatedAt',
        db.raw('(SELECT COUNT(*) FROM users WHERE users.tenant_id = tenants.id) as "userCount"')
      );

    if (search) {
      query = query.where((builder) => {
        builder.whereILike('tenants.name', `%${search}%`)
          .orWhereILike('tenants.contact_email', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('tenants.status', status);
    }

    if (packageId) {
      query = query.where('tenants.package_id', packageId);
    }

    // Total count query
    let countQuery = db('tenants').whereNot('id', SYSTEM_TENANT_ID);
    if (search) {
      countQuery = countQuery.where((builder) => {
        builder.whereILike('name', `%${search}%`)
          .orWhereILike('contact_email', `%${search}%`);
      });
    }
    if (status) {
      countQuery = countQuery.where('status', status);
    }
    if (packageId) {
      countQuery = countQuery.where('package_id', packageId);
    }
    const countRes = await countQuery.count('id as total').first();
    const totalTenants = parseInt(countRes?.total || 0, 10);

    const validSortCols = ['name', 'created_at', 'status', 'package_id'];
    const safeSortCol = validSortCols.includes(sortBy) ? `tenants.${sortBy}` : 'tenants.created_at';
    const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const tenants = await query.orderBy(safeSortCol, safeOrder).limit(limitNum).offset(offset);

    return {
      tenants: tenants.map((t) => ({
        ...t,
        userCount: parseInt(t.userCount || 0, 10),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalTenants,
        totalPages: Math.ceil(totalTenants / limitNum) || 1,
      },
    };
  }

  /**
   * Get comprehensive details for a single tenant
   */
  async getTenantDetails(tenantId) {
    const tenant = await db('tenants')
      .leftJoin('packages', 'tenants.package_id', 'packages.id')
      .select(
        'tenants.id',
        'tenants.name',
        'tenants.package_id as packageId',
        'packages.name as packageName',
        'packages.tier as packageTier',
        'packages.limits as packageLimits',
        'tenants.status',
        'tenants.contact_email as contactEmail',
        'tenants.contact_phone as contactPhone',
        'tenants.created_at as createdAt',
        'tenants.updated_at as updatedAt'
      )
      .where('tenants.id', tenantId)
      .first();

    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }

    const users = await db('users')
      .where('tenant_id', tenantId)
      .select('id', 'email', 'first_name as firstName', 'last_name as lastName', 'role', 'status', 'last_login_at as lastLoginAt', 'created_at as createdAt')
      .orderBy('created_at', 'desc');

    const recentAuditLogs = await db('audit_logs')
      .where('target_tenant_id', tenantId)
      .orderBy('created_at', 'desc')
      .limit(10);

    return {
      ...tenant,
      users,
      userCount: users.length,
      auditLogs: recentAuditLogs,
    };
  }

  /**
   * Update tenant status (active, suspended, cancelled, trialing)
   */
  async updateTenantStatus(tenantId, { status, reason = '' }, adminUser, ipAddress = null) {
    const tenant = await db('tenants').where('id', tenantId).first();

    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }

    const validStatuses = ['active', 'suspended', 'cancelled', 'trialing'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const oldStatus = tenant.status;
    await db('tenants')
      .where('id', tenantId)
      .update({
        status,
        updated_at: db.fn.now(),
      });

    // If suspended, invalidate all refresh tokens for users in that tenant
    if (status === 'suspended') {
      const users = await db('users').where('tenant_id', tenantId).select('id');
      for (const u of users) {
        try {
          await redis.del(`refresh_token:${u.id}`);
        } catch {
          // ignore redis error in dev mock
        }
      }
    }

    // Record audit log
    await this.recordAuditLog({
      adminUserId: adminUser.id,
      targetTenantId: tenantId,
      action: 'TENANT_STATUS_UPDATE',
      details: {
        oldStatus,
        newStatus: status,
        reason,
      },
      ipAddress,
    });

    return {
      id: tenantId,
      name: tenant.name,
      status,
      previousStatus: oldStatus,
      message: `Tenant status successfully updated to ${status}`,
    };
  }

  /**
   * Override tenant's package tier
   */
  async overrideTenantPackage(tenantId, { packageId, reason = '' }, adminUser, ipAddress = null) {
    const tenant = await db('tenants').where('id', tenantId).first();

    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }

    const pkg = await db('packages').where('id', packageId).first();
    if (!pkg) {
      const error = new Error(`Package with id '${packageId}' not found`);
      error.statusCode = 400;
      throw error;
    }

    const oldPackageId = tenant.package_id;
    await db('tenants')
      .where('id', tenantId)
      .update({
        package_id: packageId,
        updated_at: db.fn.now(),
      });

    // Record audit log
    await this.recordAuditLog({
      adminUserId: adminUser.id,
      targetTenantId: tenantId,
      action: 'TENANT_PACKAGE_OVERRIDE',
      details: {
        oldPackageId,
        newPackageId: packageId,
        packageName: pkg.name,
        reason,
      },
      ipAddress,
    });

    return {
      id: tenantId,
      name: tenant.name,
      packageId,
      packageName: pkg.name,
      message: `Tenant package override applied: ${pkg.name}`,
    };
  }

  /**
   * Get platform-wide global analytics and health telemetry
   */
  async getGlobalAnalytics() {
    const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

    const [tenantsCount] = await db('tenants').whereNot('id', SYSTEM_TENANT_ID).count('id as total');
    const [activeTenants] = await db('tenants').whereNot('id', SYSTEM_TENANT_ID).where('status', 'active').count('id as total');
    const [suspendedTenants] = await db('tenants').whereNot('id', SYSTEM_TENANT_ID).where('status', 'suspended').count('id as total');
    const [usersCount] = await db('users').whereNot('tenant_id', SYSTEM_TENANT_ID).count('id as total');

    const tierBreakdown = await db('tenants')
      .whereNot('tenants.id', SYSTEM_TENANT_ID)
      .leftJoin('packages', 'tenants.package_id', 'packages.id')
      .select(db.raw("COALESCE(packages.name, 'Unassigned') as name"), 'tenants.package_id as id')
      .count('tenants.id as count')
      .groupBy('packages.name', 'tenants.package_id');

    const [auditLogCount] = await db('audit_logs').count('id as total');

    return {
      metrics: {
        totalTenants: parseInt(tenantsCount?.total || 0, 10),
        activeTenants: parseInt(activeTenants?.total || 0, 10),
        suspendedTenants: parseInt(suspendedTenants?.total || 0, 10),
        totalUsers: parseInt(usersCount?.total || 0, 10),
        totalAuditLogs: parseInt(auditLogCount?.total || 0, 10),
      },
      tierDistribution: tierBreakdown.map((t) => ({
        id: t.id || 'unassigned',
        name: t.name,
        count: parseInt(t.count || 0, 10),
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Record an immutable audit log entry
   */
  async recordAuditLog({ adminUserId, targetTenantId = null, action, details = {}, ipAddress = null }) {
    const logEntry = {
      id: randomUUID(),
      admin_user_id: adminUserId,
      target_tenant_id: targetTenantId,
      action,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      ip_address: ipAddress,
      created_at: db.fn.now(),
    };

    await db('audit_logs').insert(logEntry);
    return logEntry;
  }

  /**
   * Get paginated audit logs
   */
  async getAuditLogs({ page = 1, limit = 50, targetTenantId = null, action = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = db('audit_logs')
      .leftJoin('tenants', 'audit_logs.target_tenant_id', 'tenants.id')
      .leftJoin('users', 'audit_logs.admin_user_id', 'users.id')
      .select(
        'audit_logs.id',
        'audit_logs.action',
        'audit_logs.details',
        'audit_logs.ip_address as ipAddress',
        'audit_logs.created_at as createdAt',
        'audit_logs.target_tenant_id as targetTenantId',
        'tenants.name as targetTenantName',
        'audit_logs.admin_user_id as adminUserId',
        'users.email as adminUserEmail'
      );

    if (targetTenantId) {
      query = query.where('audit_logs.target_tenant_id', targetTenantId);
    }
    if (action) {
      query = query.where('audit_logs.action', action);
    }

    let countQuery = db('audit_logs');
    if (targetTenantId) {
      countQuery = countQuery.where('target_tenant_id', targetTenantId);
    }
    if (action) {
      countQuery = countQuery.where('action', action);
    }
    const countRes = await countQuery.count('id as total').first();
    const totalLogs = parseInt(countRes?.total || 0, 10);

    const logs = await query.orderBy('audit_logs.created_at', 'desc').limit(limitNum).offset(offset);

    return {
      logs: logs.map((l) => ({
        ...l,
        details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limitNum) || 1,
      },
    };
  }
}

module.exports = new AdminService();
