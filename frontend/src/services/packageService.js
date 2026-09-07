import { apiClient } from './apiClient';

export const packageService = {
  /**
   * Fetch all available subscription packages
   */
  async getAllPackages() {
    const res = await apiClient.get('/api/packages');
    return res.data;
  },

  /**
   * Fetch active plan, limits, and resource utilization report for current tenant
   */
  async getMyPlan() {
    const res = await apiClient.get('/api/packages/tenant/my-plan');
    return res.data;
  },

  /**
   * Upgrade or downgrade active plan
   */
  async changePlan(packageId) {
    const res = await apiClient.post('/api/packages/tenant/upgrade', { packageId });
    return res;
  },

  /**
   * Initialize simulated Stripe checkout session
   */
  async createCheckoutSession(packageId, billingInterval = 'monthly') {
    const res = await apiClient.post('/api/packages/tenant/checkout-session', {
      packageId,
      billingInterval,
    });
    return res.data;
  },

  /**
   * Trigger payment webhook activation (demo / simulated environment)
   */
  async simulateWebhookPayment(tenantId, packageId) {
    const res = await apiClient.post('/api/packages/webhook', {
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: tenantId,
          metadata: { package_id: packageId },
        },
      },
    });
    return res.data;
  },
};
