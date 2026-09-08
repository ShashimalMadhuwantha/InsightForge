const request = require('supertest');
const app = require('../../../app');
const { generateAccessToken } = require('../../../common/utils/token');
const widgetsService = require('../widgets.service');

describe('Widgets & Visualization API Routes (Epic 6 Tasks 6.1 to 6.4)', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const tenant2Id = '00000000-0000-0000-0000-000000000002';

  const tenantToken = generateAccessToken({
    id: 'user-admin-1',
    email: 'admin@acme.com',
    role: 'tenant_admin',
    tenantId,
  });

  const viewerToken = generateAccessToken({
    id: 'user-viewer-1',
    email: 'viewer@acme.com',
    role: 'viewer',
    tenantId,
  });

  const tenant2Token = generateAccessToken({
    id: 'user-tenant2-1',
    email: 'admin@globex.com',
    role: 'tenant_admin',
    tenantId: tenant2Id,
  });

  describe('POST /api/widgets (Create Widget & Package Gating)', () => {
    it('creates a bar chart widget successfully for authorized tenant', async () => {
      jest.spyOn(widgetsService, 'createWidget').mockResolvedValueOnce({
        id: 'widget-101',
        title: 'Monthly Revenue by Region',
        type: 'bar',
        data_source_id: 'ds-100',
        config: { dimension: 'region', measures: [{ column: 'revenue', aggregation: 'sum' }] },
      });

      const res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Monthly Revenue by Region',
          type: 'bar',
          data_source_id: 'ds-100',
          config: { dimension: 'region', measures: [{ column: 'revenue', aggregation: 'sum' }] },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('widget-101');
      expect(res.body.data.type).toBe('bar');
    });

    it('rejects widget creation from viewer role with 403', async () => {
      const res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Unauthorized Widget',
          type: 'bar',
          data_source_id: 'ds-100',
        });

      expect(res.status).toBe(403);
    });

    it('blocks creation of premium widget types when package entitlement is exceeded', async () => {
      const error = new Error("Widget type 'gauge' is not available on the Free Explorer tier. Upgrade to unlock more visualization widgets.");
      error.statusCode = 403;
      error.code = 'FEATURE_NOT_INCLUDED';
      jest.spyOn(widgetsService, 'createWidget').mockRejectedValueOnce(error);

      const res = await request(app)
        .post('/api/widgets')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Gauge Widget',
          type: 'gauge',
          data_source_id: 'ds-100',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('gauge');
    });
  });

  describe('GET /api/widgets (List & Multi-Tenancy)', () => {
    it('lists widgets for the requesting tenant', async () => {
      jest.spyOn(widgetsService, 'listWidgets').mockResolvedValueOnce({
        widgets: [
          { id: 'w-1', title: 'Widget 1', type: 'bar' },
          { id: 'w-2', title: 'Widget 2', type: 'line' },
        ],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      const res = await request(app)
        .get('/api/widgets')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/widgets/:id', () => {
    it('returns widget details when found', async () => {
      jest.spyOn(widgetsService, 'getWidgetById').mockResolvedValueOnce({
        id: 'w-1',
        title: 'Widget 1',
        type: 'bar',
      });

      const res = await request(app)
        .get('/api/widgets/w-1')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('w-1');
    });

    it('enforces tenant isolation (404 when requesting another tenant widget)', async () => {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      jest.spyOn(widgetsService, 'getWidgetById').mockRejectedValueOnce(error);

      const res = await request(app)
        .get('/api/widgets/w-foreign')
        .set('Authorization', `Bearer ${tenant2Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/widgets/query (Execution Engine)', () => {
    it('executes aggregation query and returns chart series and categories', async () => {
      jest.spyOn(widgetsService, 'executeWidgetQuery').mockResolvedValueOnce({
        widgetType: 'bar',
        queryResult: {
          categories: ['North', 'South'],
          series: [{ name: 'sales', data: [1000, 1500] }],
          tableData: [{ region: 'North', sales: 1000 }, { region: 'South', sales: 1500 }],
        },
        executionTimeMs: 12,
      });

      const res = await request(app)
        .post('/api/widgets/query')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          dataSourceId: 'ds-100',
          type: 'bar',
          config: { dimension: 'region', measures: [{ column: 'sales', aggregation: 'sum' }] },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queryResult.categories).toEqual(['North', 'South']);
    });
  });

  describe('GET /api/widgets/suggestions/:dataSourceId', () => {
    it('returns auto-suggested chart recommendations', async () => {
      jest.spyOn(widgetsService, 'getSuggestions').mockResolvedValueOnce({
        dataSourceId: 'ds-100',
        suggestions: [
          { type: 'line', title: 'Revenue Trend', isLocked: false },
          { type: 'bar', title: 'Revenue by Category', isLocked: false },
          { type: 'gauge', title: 'Target Gauge', isLocked: true },
        ],
      });

      const res = await request(app)
        .get('/api/widgets/suggestions/ds-100')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestions.length).toBe(3);
      expect(res.body.data.suggestions[2].isLocked).toBe(true);
    });
  });
});
