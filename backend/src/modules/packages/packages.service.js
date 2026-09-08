const { randomUUID } = require('crypto');
const { db } = require('../../common/config/db');
const entitlementService = require('./entitlement.service');

class PackagesService {
  /**
   * List all available subscription packages
   */
  async getAllPackages() {
    const packages = await db('packages')
      .where('is_active', true)
      .orderBy('price_monthly', 'asc');

    return packages.map((pkg) => ({
      ...pkg,
      price_monthly: parseFloat(pkg.price_monthly || 0),
      limits: entitlementService.parseLimits(pkg.limits),
    }));
  }

  /**
   * Get single package by ID
   */
  async getPackageById(packageId) {
    const pkg = await db('packages')
      .where('id', packageId)
      .first();

    if (!pkg) {
      const error = new Error(`Package '${packageId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return {
      ...pkg,
      price_monthly: parseFloat(pkg.price_monthly || 0),
      limits: entitlementService.parseLimits(pkg.limits),
    };
  }

  /**
   * Assign / Upgrade / Downgrade package for a tenant
   */
  async assignTenantPackage(tenantId, packageId, user = null) {
    const pkg = await this.getPackageById(packageId);

    const tenant = await db('tenants')
      .where('id', tenantId)
      .first();

    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }

    const previousPackageId = tenant.package_id;

    await db('tenants')
      .where('id', tenantId)
      .update({
        package_id: pkg.id,
        updated_at: new Date(),
      });

    // Write audit log if table exists
    const hasAuditTable = await db.schema.hasTable('audit_logs');
    if (hasAuditTable) {
      const adminUserId = user?.id && user.id.length === 36 ? user.id : '00000000-0000-0000-0000-000000000001';
      await db('audit_logs').insert({
        id: randomUUID(),
        admin_user_id: adminUserId,
        target_tenant_id: tenantId,
        action: 'TENANT_PACKAGE_UPDATE',
        details: JSON.stringify({
          from: previousPackageId,
          to: pkg.id,
          packageName: pkg.name,
          source: user?.role === 'super_admin' ? 'super_admin' : user?.email ? 'tenant_self_serve' : 'billing_webhook',
        }),
        created_at: new Date(),
      });
    }

    return {
      tenantId,
      package: pkg,
      previousPackageId,
    };
  }

  /**
   * Create simulated Stripe checkout session (Stub for Task 3.7)
   */
  async createCheckoutSession(tenantId, packageId, user, billingInterval = 'monthly') {
    const pkg = await this.getPackageById(packageId);

    const isAnnual = billingInterval === 'annual';
    const annualDiscount = 0.8; // 20% discount on annual
    const unitPrice = isAnnual ? parseFloat((pkg.price_monthly * 12 * annualDiscount).toFixed(2)) : pkg.price_monthly;

    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      sessionId,
      url: `/checkout/simulated?session_id=${sessionId}&tenant_id=${tenantId}&package_id=${packageId}`,
      packageId: pkg.id,
      packageName: pkg.name,
      currency: 'usd',
      unitPrice,
      billingInterval,
      customerEmail: user?.email,
      status: 'open',
    };
  }

  /**
   * Billing webhook handler (Stub for Task 3.7)
   */
  async handleWebhook(event) {
    if (!event || !event.type) {
      const error = new Error('Invalid webhook event payload');
      error.statusCode = 400;
      throw error;
    }

    const { type, data } = event;

    if (type === 'checkout.session.completed' || type === 'invoice.payment_succeeded') {
      const tenantId = data?.object?.client_reference_id || data?.object?.tenant_id;
      const packageId = data?.object?.metadata?.package_id || data?.object?.package_id;

      if (tenantId && packageId) {
        await this.assignTenantPackage(tenantId, packageId, {
          email: 'stripe-webhook@insightforge.internal',
          role: 'system',
        });
        return { received: true, activated: true, tenantId, packageId };
      }
    }

    return { received: true, processed: false };
  }
}

module.exports = new PackagesService();
