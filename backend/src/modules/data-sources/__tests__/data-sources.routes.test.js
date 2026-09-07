const request = require('supertest');
const app = require('../../../app');
const dataSourcesService = require('../data-sources.service');
const entitlementService = require('../../packages/entitlement.service');
const { generateAccessToken } = require('../../../common/utils/token');

describe('Data Sources Module API Routes & Entitlement Integration Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const tenantToken = generateAccessToken({
    id: 'u-1',
    tenant_id: 't-1',
    email: 'owner@acme.com',
    role: 'owner',
  });

  describe('GET /api/data-sources', () => {
    it('returns paginated data sources for authenticated tenant', async () => {
      jest.spyOn(dataSourcesService, 'listDataSources').mockResolvedValueOnce({
        dataSources: [
          { id: 'ds-1', name: 'Q1 Sales Data', status: 'ready', row_count: 500, quality_metrics: { overall_score: 95 } },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const res = await request(app)
        .get('/api/data-sources')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dataSources.length).toBe(1);
      expect(res.body.dataSources[0].name).toBe('Q1 Sales Data');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/data-sources');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/data-sources/upload', () => {
    it('successfully uploads and queues dataset for parsing', async () => {
      const csvContent = 'id,product,sales\n1,Widget A,100\n2,Widget B,250\n';
      const buffer = Buffer.from(csvContent, 'utf-8');

      jest.spyOn(entitlementService, 'assertLimit').mockResolvedValue({ allowed: true });
      jest.spyOn(dataSourcesService, 'createDataSource').mockResolvedValueOnce({
        id: 'ds-123',
        name: 'test_sales',
        status: 'processing',
        file_type: 'csv',
        current_version: 1,
      });

      const res = await request(app)
        .post('/api/data-sources/upload')
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', buffer, 'test_sales.csv')
        .field('name', 'Q1 Test Sales');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('ds-123');
    });

    it('rejects upload when tenant data source quota is exceeded with 403', async () => {
      const csvContent = 'id,product\n1,A\n';
      const buffer = Buffer.from(csvContent, 'utf-8');

      const quotaErr = new Error('Data sources limit exceeded (2/2). Please upgrade your subscription plan.');
      quotaErr.statusCode = 403;
      quotaErr.code = 'QUOTA_EXCEEDED';

      jest.spyOn(dataSourcesService, 'createDataSource').mockRejectedValueOnce(quotaErr);

      const res = await request(app)
        .post('/api/data-sources/upload')
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', buffer, 'extra_sales.csv');

      expect(res.statusCode).toBe(403);
    });

    it('rejects unsupported file extensions with 400', async () => {
      const buffer = Buffer.from('console.log("bad")', 'utf-8');

      const res = await request(app)
        .post('/api/data-sources/upload')
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', buffer, 'malicious.exe');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid file format');
    });
  });

  describe('GET /api/data-sources/:id and /status', () => {
    it('returns data source details and schema profile', async () => {
      jest.spyOn(dataSourcesService, 'getDataSourceById').mockResolvedValueOnce({
        id: 'ds-1',
        name: 'Sales Dataset',
        status: 'ready',
        row_count: 200,
        column_count: 3,
        schema_profile: [{ name: 'sales', type: 'numeric' }],
        quality_metrics: { overall_score: 98 },
        versions: [{ version_number: 1, file_size_bytes: 1024 }],
      });

      const res = await request(app)
        .get('/api/data-sources/ds-1')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sales Dataset');
      expect(res.body.data.versions.length).toBe(1);
    });

    it('returns data source status telemetry', async () => {
      jest.spyOn(dataSourcesService, 'getDataSourceById').mockResolvedValueOnce({
        id: 'ds-1',
        name: 'Sales Dataset',
        status: 'ready',
        row_count: 200,
        column_count: 3,
        quality_metrics: { overall_score: 98 },
        error_message: null,
        updated_at: new Date(),
      });

      const res = await request(app)
        .get('/api/data-sources/ds-1/status')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.qualityMetrics.overall_score).toBe(98);
    });
  });

  describe('DELETE /api/data-sources/:id', () => {
    it('deletes data source for authorized owner/admin', async () => {
      jest.spyOn(dataSourcesService, 'deleteDataSource').mockResolvedValueOnce({
        id: 'ds-1',
        message: 'Data source successfully deleted',
      });

      const res = await request(app)
        .delete('/api/data-sources/ds-1')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects viewer role from deleting data source with 403', async () => {
      const viewerToken = generateAccessToken({
        id: 'u-viewer',
        tenant_id: 't-1',
        email: 'viewer@acme.com',
        role: 'viewer',
      });

      const res = await request(app)
        .delete('/api/data-sources/ds-1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
