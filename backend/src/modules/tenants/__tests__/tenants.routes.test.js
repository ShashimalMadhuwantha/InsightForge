const request = require('supertest');
const app = require('../../../app');
const tenantsService = require('../tenants.service');
const { generateAccessToken } = require('../../../common/utils/token');

describe('Tenants Module Integration & API Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/tenants/profile returns tenant information for owner', async () => {
    const token = generateAccessToken({
      id: 'u1',
      tenant_id: 't1',
      email: 'owner@acme.com',
      role: 'owner',
    });

    jest.spyOn(tenantsService, 'getTenantDetails').mockResolvedValueOnce({
      id: 't1',
      name: 'Acme Corporation',
      status: 'active',
      package: { id: 'starter', name: 'Starter Team' },
    });

    const res = await request(app)
      .get('/api/tenants/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Acme Corporation');
  });

  it('PUT /api/tenants/profile updates tenant settings for owner', async () => {
    const token = generateAccessToken({
      id: 'u1',
      tenant_id: 't1',
      email: 'owner@acme.com',
      role: 'owner',
    });

    jest.spyOn(tenantsService, 'updateTenantProfile').mockResolvedValueOnce({
      id: 't1',
      name: 'Acme Global Inc',
      status: 'active',
    });

    const res = await request(app)
      .put('/api/tenants/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Global Inc' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Acme Global Inc');
  });

  it('PUT /api/tenants/profile rejects non-admin users with 403 Forbidden', async () => {
    const token = generateAccessToken({
      id: 'u2',
      tenant_id: 't1',
      email: 'viewer@acme.com',
      role: 'viewer',
    });

    const res = await request(app)
      .put('/api/tenants/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked Name' });

    expect(res.statusCode).toBe(403);
    expect(res.body.status).toBe('error');
  });
});
