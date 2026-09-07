const request = require('supertest');
const app = require('../../../app');
const packagesService = require('../packages.service');
const entitlementService = require('../entitlement.service');
const { generateAccessToken } = require('../../../common/utils/token');

describe('Packages Module Integration & API Routes Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/packages', () => {
    it('returns list of active packages publicly', async () => {
      jest.spyOn(packagesService, 'getAllPackages').mockResolvedValueOnce([
        { id: 'free', name: 'Free Explorer', tier: 'free', price_monthly: 0, limits: {} },
        { id: 'starter', name: 'Starter Team', tier: 'starter', price_monthly: 29, limits: {} },
      ]);

      const res = await request(app).get('/api/packages');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].id).toBe('free');
    });

    it('returns single package details by ID', async () => {
      jest.spyOn(packagesService, 'getPackageById').mockResolvedValueOnce({
        id: 'starter',
        name: 'Starter Team',
        tier: 'starter',
        price_monthly: 29,
        limits: { max_sub_users: 5 },
      });

      const res = await request(app).get('/api/packages/starter');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Starter Team');
    });
  });

  describe('GET /api/packages/tenant/my-plan', () => {
    it('returns 401 when request is not authenticated', async () => {
      const res = await request(app).get('/api/packages/tenant/my-plan');
      expect(res.statusCode).toBe(401);
    });

    it('returns active plan and quota report for authenticated tenant', async () => {
      const token = generateAccessToken({
        id: 'u-1',
        tenantId: 't-1',
        email: 'owner@acme.com',
        role: 'owner',
      });

      jest.spyOn(entitlementService, 'getQuotaReport').mockResolvedValueOnce({
        package: { id: 'starter', name: 'Starter Team', tier: 'starter' },
        usage: { users: 2, subUsers: 1, dataSources: 3 },
        quotas: {
          subUsers: { current: 1, max: 5, remaining: 4, isExceeded: false },
          dataSources: { current: 3, max: 10, remaining: 7, isExceeded: false },
          maxFileSizeMb: 25,
        },
        features: {
          allowedCleansingOps: ['trim_whitespace'],
          allowedWidgetTypes: ['table', 'bar'],
          insightDepth: 'standard',
        },
      });

      const res = await request(app)
        .get('/api/packages/tenant/my-plan')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.package.name).toBe('Starter Team');
      expect(res.body.data.quotas.subUsers.max).toBe(5);
    });
  });

  describe('POST /api/packages/tenant/upgrade', () => {
    it('allows owner to upgrade/change package', async () => {
      const token = generateAccessToken({
        id: 'u-1',
        tenantId: 't-1',
        email: 'owner@acme.com',
        role: 'owner',
      });

      jest.spyOn(packagesService, 'assignTenantPackage').mockResolvedValueOnce({
        tenantId: 't-1',
        package: { id: 'growth', name: 'Growth Business' },
        previousPackageId: 'free',
      });

      const res = await request(app)
        .post('/api/packages/tenant/upgrade')
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: 'growth' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.package.name).toBe('Growth Business');
    });

    it('rejects non-owner/non-admin roles with 403', async () => {
      const token = generateAccessToken({
        id: 'u-viewer',
        tenantId: 't-1',
        email: 'viewer@acme.com',
        role: 'viewer',
      });

      const res = await request(app)
        .post('/api/packages/tenant/upgrade')
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: 'growth' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/packages/tenant/checkout-session', () => {
    it('creates simulated stripe checkout session', async () => {
      const token = generateAccessToken({
        id: 'u-1',
        tenantId: 't-1',
        email: 'owner@acme.com',
        role: 'owner',
      });

      jest.spyOn(packagesService, 'createCheckoutSession').mockResolvedValueOnce({
        sessionId: 'cs_test_123',
        url: '/checkout/simulated?session_id=cs_test_123',
        packageId: 'growth',
        packageName: 'Growth Business',
        unitPrice: 79,
        billingInterval: 'monthly',
      });

      const res = await request(app)
        .post('/api/packages/tenant/checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: 'growth', billingInterval: 'monthly' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe('cs_test_123');
    });
  });

  describe('POST /api/packages/webhook', () => {
    it('processes simulated payment webhook and activates package', async () => {
      jest.spyOn(packagesService, 'handleWebhook').mockResolvedValueOnce({
        received: true,
        activated: true,
        tenantId: 't-1',
        packageId: 'growth',
      });

      const res = await request(app)
        .post('/api/packages/webhook')
        .send({
          type: 'checkout.session.completed',
          data: {
            object: {
              client_reference_id: 't-1',
              metadata: { package_id: 'growth' },
            },
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activated).toBe(true);
    });
  });
});
