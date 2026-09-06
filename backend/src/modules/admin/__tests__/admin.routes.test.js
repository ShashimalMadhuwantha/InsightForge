const request = require('supertest');
const { randomUUID } = require('crypto');
const app = require('../../../app');
const { db } = require('../../../common/config/db');
const { generateAccessToken } = require('../../../common/utils/token');

describe('Super Admin Management API (/api/admin)', () => {
  let superAdminToken;
  let regularUserToken;
  let testTenantId;
  let testUserId;
  let superAdminId;

  beforeAll(async () => {
    await db.migrate.latest();
    await db.seed.run();

    superAdminId = randomUUID();
    testTenantId = randomUUID();
    testUserId = randomUUID();

    // Create a regular tenant and user
    await db('tenants').insert({
      id: testTenantId,
      name: 'Acme Test Corp',
      package_id: 'starter',
      status: 'active',
      contact_email: 'contact@acme.com',
    });

    await db('users').insert({
      id: testUserId,
      tenant_id: testTenantId,
      email: 'owner@acme.com',
      password_hash: 'hashed_pw',
      role: 'owner',
      status: 'active',
    });

    // Generate tokens
    superAdminToken = generateAccessToken({
      id: superAdminId,
      tenantId: '00000000-0000-0000-0000-000000000000',
      email: 'admin@insightforge.internal',
      role: 'super_admin',
    });

    regularUserToken = generateAccessToken({
      id: testUserId,
      tenantId: testTenantId,
      email: 'owner@acme.com',
      role: 'owner',
    });
  });

  afterAll(async () => {
    try {
      await db('audit_logs').del();
      await db('users').where('id', testUserId).del();
      await db('tenants').where('id', testTenantId).del();
    } catch {
      // cleanup ignore
    }
  });

  describe('Authorization & Role Guard', () => {
    it('returns 401 if no token is provided', async () => {
      const res = await request(app).get('/api/admin/tenants');
      expect(res.status).toBe(401);
    });

    it('returns 403 if user does not have super_admin role', async () => {
      const res = await request(app)
        .get('/api/admin/tenants')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Super Admin privileges required/i);
    });
  });

  describe('GET /api/admin/tenants', () => {
    it('returns paginated list of all tenants for Super Admin', async () => {
      const res = await request(app)
        .get('/api/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThan(0);

      const found = res.body.data.find((t) => t.id === testTenantId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Acme Test Corp');
      expect(found.userCount).toBe(1);
    });

    it('supports search query filter', async () => {
      const res = await request(app)
        .get('/api/admin/tenants?search=Acme')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Acme');
    });
  });

  describe('GET /api/admin/tenants/:id', () => {
    it('returns comprehensive tenant details and users list', async () => {
      const res = await request(app)
        .get(`/api/admin/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(testTenantId);
      expect(res.body.data.name).toBe('Acme Test Corp');
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBe(1);
      expect(res.body.data.users[0].email).toBe('owner@acme.com');
    });

    it('returns 404 for non-existent tenant ID', async () => {
      const nonExistentId = randomUUID();
      const res = await request(app)
        .get(`/api/admin/tenants/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/tenants/:id/status', () => {
    it('suspends a tenant and creates an audit log entry', async () => {
      const res = await request(app)
        .patch(`/api/admin/tenants/${testTenantId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'suspended',
          reason: 'Terms of service violation review',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');

      // Verify in DB
      const updated = await db('tenants').where('id', testTenantId).first();
      expect(updated.status).toBe('suspended');

      // Verify audit log
      const auditLog = await db('audit_logs')
        .where({ target_tenant_id: testTenantId, action: 'TENANT_STATUS_UPDATE' })
        .first();
      expect(auditLog).toBeDefined();
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .patch(`/api/admin/tenants/${testTenantId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'invalid_status_enum' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/admin/tenants/:id/package', () => {
    it('overrides tenant package tier and records audit log', async () => {
      const res = await request(app)
        .patch(`/api/admin/tenants/${testTenantId}/package`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          packageId: 'growth',
          reason: 'Promotional business trial upgrade',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.packageId).toBe('growth');

      // Verify in DB
      const updated = await db('tenants').where('id', testTenantId).first();
      expect(updated.package_id).toBe('growth');
    });

    it('returns 400 for non-existent packageId', async () => {
      const res = await request(app)
        .patch(`/api/admin/tenants/${testTenantId}/package`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ packageId: 'non_existent_tier_xyz' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/admin/analytics/overview', () => {
    it('returns global platform metrics and tier distribution', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalTenants).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.tierDistribution)).toBe(true);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('returns paginated audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
