const { db } = require('../../common/config/db');

const DEPTH_RANKS = {
  basic: 1,
  standard: 2,
  advanced: 3,
  deep: 4,
};

class EntitlementService {
  /**
   * Helper to parse package limits JSON securely
   */
  parseLimits(limits) {
    if (!limits) {
      return {
        max_sub_users: 1,
        max_data_sources: 2,
        max_file_size_mb: 5,
        allowed_cleansing_ops: ['trim_whitespace', 'remove_duplicates'],
        allowed_widget_types: ['table', 'bar', 'line'],
        insight_depth: 'basic',
      };
    }
    if (typeof limits === 'string') {
      try {
        return JSON.parse(limits);
      } catch {
        return {};
      }
    }
    return limits;
  }

  /**
   * Get active package and parsed limits for a tenant
   */
  async getTenantPackage(tenantId) {
    const tenant = await db('tenants')
      .where('tenants.id', tenantId)
      .leftJoin('packages', 'tenants.package_id', 'packages.id')
      .select(
        'tenants.id as tenant_id',
        'tenants.name as tenant_name',
        'tenants.package_id',
        'packages.name as package_name',
        'packages.tier as package_tier',
        'packages.price_monthly',
        'packages.limits'
      )
      .first();

    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }

    const limits = this.parseLimits(tenant.limits);

    return {
      tenantId: tenant.tenant_id,
      tenantName: tenant.tenant_name,
      packageId: tenant.package_id || 'free',
      packageName: tenant.package_name || 'Free Explorer',
      tier: tenant.package_tier || 'free',
      priceMonthly: parseFloat(tenant.price_monthly || 0),
      limits,
    };
  }

  /**
   * Get current resource usage metrics for a tenant
   */
  async getTenantUsage(tenantId) {
    // 1. User count (excluding deactivated if any, or total active users)
    const userCountRes = await db('users')
      .where('tenant_id', tenantId)
      .whereNot('status', 'suspended')
      .count('* as count')
      .first();
    const userCount = parseInt(userCountRes?.count || 0, 10);
    // Sub-users are users beyond the workspace owner (at least total - 1, min 0)
    const subUsersCount = Math.max(0, userCount - 1);

    // 2. Data source count (if data_sources table exists)
    let dataSourcesCount = 0;
    const hasDataSources = await db.schema.hasTable('data_sources');
    if (hasDataSources) {
      const dsRes = await db('data_sources')
        .where('tenant_id', tenantId)
        .count('* as count')
        .first();
      dataSourcesCount = parseInt(dsRes?.count || 0, 10);
    }

    return {
      users: userCount,
      subUsers: subUsersCount,
      dataSources: dataSourcesCount,
    };
  }

  /**
   * Complete quota report (Limits vs Usage)
   */
  async getQuotaReport(tenantId) {
    const pkg = await this.getTenantPackage(tenantId);
    const usage = await this.getTenantUsage(tenantId);

    return {
      package: pkg,
      usage,
      quotas: {
        subUsers: {
          current: usage.subUsers,
          max: pkg.limits.max_sub_users,
          remaining: Math.max(0, pkg.limits.max_sub_users - usage.subUsers),
          isExceeded: usage.subUsers >= pkg.limits.max_sub_users,
        },
        dataSources: {
          current: usage.dataSources,
          max: pkg.limits.max_data_sources,
          remaining: Math.max(0, pkg.limits.max_data_sources - usage.dataSources),
          isExceeded: usage.dataSources >= pkg.limits.max_data_sources,
        },
        maxFileSizeMb: pkg.limits.max_file_size_mb,
      },
      features: {
        allowedCleansingOps: pkg.limits.allowed_cleansing_ops || [],
        allowedWidgetTypes: pkg.limits.allowed_widget_types || [],
        insightDepth: pkg.limits.insight_depth || 'basic',
      },
    };
  }

  /**
   * Check if a numerical limit allows adding resources
   */
  async checkLimit(tenantId, resourceType, requestedCount = 1) {
    const pkg = await this.getTenantPackage(tenantId);

    if (resourceType === 'sub_users') {
      const usage = await this.getTenantUsage(tenantId);
      const current = usage.subUsers;
      const limit = pkg.limits.max_sub_users;
      const allowed = current + requestedCount <= limit;
      return {
        allowed,
        resourceType,
        current,
        limit,
        requested: requestedCount,
        message: allowed
          ? 'Within sub-user quota.'
          : `Sub-user quota exceeded (${current}/${limit}). Please upgrade your subscription plan.`,
      };
    }

    if (resourceType === 'data_sources') {
      const usage = await this.getTenantUsage(tenantId);
      const current = usage.dataSources;
      const limit = pkg.limits.max_data_sources;
      const allowed = current + requestedCount <= limit;
      return {
        allowed,
        resourceType,
        current,
        limit,
        requested: requestedCount,
        message: allowed
          ? 'Within data sources quota.'
          : `Data sources limit exceeded (${current}/${limit}). Please upgrade your subscription plan.`,
      };
    }

    if (resourceType === 'file_size_mb') {
      const limit = pkg.limits.max_file_size_mb;
      const allowed = requestedCount <= limit;
      return {
        allowed,
        resourceType,
        limit,
        requested: requestedCount,
        message: allowed
          ? 'File size within limit.'
          : `File size (${requestedCount}MB) exceeds your plan limit (${limit}MB). Please upgrade to upload larger datasets.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if a feature is allowed by the package
   */
  async checkFeature(tenantId, featureType, featureValue) {
    const pkg = await this.getTenantPackage(tenantId);

    if (featureType === 'cleansing_op') {
      const ops = pkg.limits.allowed_cleansing_ops || [];
      const isWildcard = ops.includes('*');
      const allowed = isWildcard || ops.includes(featureValue);
      return {
        allowed,
        featureType,
        featureValue,
        allowedValues: ops,
        message: allowed
          ? 'Cleansing operation allowed.'
          : `Cleansing operation '${featureValue}' is not available on the ${pkg.packageName} tier. Upgrade to unlock this operation.`,
      };
    }

    if (featureType === 'widget_type') {
      const widgets = pkg.limits.allowed_widget_types || [];
      const isWildcard = widgets.includes('*');
      const allowed = isWildcard || widgets.includes(featureValue);
      return {
        allowed,
        featureType,
        featureValue,
        allowedValues: widgets,
        message: allowed
          ? 'Widget type allowed.'
          : `Widget type '${featureValue}' is not available on the ${pkg.packageName} tier. Upgrade to unlock more visualization widgets.`,
      };
    }

    if (featureType === 'insight_depth') {
      const currentDepth = pkg.limits.insight_depth || 'basic';
      const requiredRank = DEPTH_RANKS[featureValue] || 1;
      const currentRank = DEPTH_RANKS[currentDepth] || 1;
      const allowed = currentRank >= requiredRank;
      return {
        allowed,
        featureType,
        featureValue,
        currentDepth,
        message: allowed
          ? 'Insight depth allowed.'
          : `Insight depth '${featureValue}' requires a higher subscription tier than ${pkg.packageName} (current: ${currentDepth}).`,
      };
    }

    return { allowed: true };
  }

  /**
   * Assert limit - throws 403 Forbidden with structured code if not allowed
   */
  async assertLimit(tenantId, resourceType, requestedCount = 1) {
    const result = await this.checkLimit(tenantId, resourceType, requestedCount);
    if (!result.allowed) {
      const error = new Error(result.message);
      error.statusCode = 403;
      error.code = 'QUOTA_EXCEEDED';
      error.details = result;
      throw error;
    }
    return result;
  }

  /**
   * Assert feature - throws 403 Forbidden with structured code if not included
   */
  async assertFeature(tenantId, featureType, featureValue) {
    const result = await this.checkFeature(tenantId, featureType, featureValue);
    if (!result.allowed) {
      const error = new Error(result.message);
      error.statusCode = 403;
      error.code = 'FEATURE_NOT_INCLUDED';
      error.details = result;
      throw error;
    }
    return result;
  }
}

module.exports = new EntitlementService();
