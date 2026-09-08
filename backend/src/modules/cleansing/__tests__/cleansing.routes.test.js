const request = require('supertest');
const app = require('../../../app');
const { generateAccessToken } = require('../../../common/utils/token');
const cleansingService = require('../cleansing.service');

describe('Data Cleansing API Routes (Epic 5 Tasks 5.3 to 5.7)', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const tenantToken = generateAccessToken({
    id: 'u-1',
    tenantId,
    email: 'owner@test.com',
    role: 'owner',
  });
  const viewerToken = generateAccessToken({
    id: 'u-2',
    tenantId,
    email: 'viewer@test.com',
    role: 'viewer',
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/data-sources/:id/cleansing/preview', () => {
    it('returns dry-run before/after diff and projected quality score improvement', async () => {
      jest.spyOn(cleansingService, 'previewCleansing').mockResolvedValueOnce({
        before: {
          rowCount: 5,
          qualityScore: 75,
          completenessPct: 90,
          missingCount: 2,
          duplicateCount: 1,
          sampleRows: [{ id: 1, name: ' Acme ' }],
        },
        after: {
          rowCount: 4,
          qualityScore: 95,
          completenessPct: 100,
          missingCount: 0,
          duplicateCount: 0,
          sampleRows: [{ id: 1, name: 'Acme' }],
        },
        telemetry: [{ type: 'remove_duplicates', rowsBefore: 5, rowsAfter: 4, rowsAffected: 1 }],
      });

      const res = await request(app)
        .post('/api/data-sources/ds-100/cleansing/preview')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          recipe: [{ type: 'remove_duplicates' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.before.rowCount).toBe(5);
      expect(res.body.data.after.rowCount).toBe(4);
      expect(res.body.data.after.qualityScore).toBe(95);
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/data-sources/ds-100/cleansing/preview')
        .send({ recipe: [] });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/data-sources/:id/cleansing/apply', () => {
    it('successfully applies cleansing recipe and creates Version 2', async () => {
      jest.spyOn(cleansingService, 'applyCleansing').mockResolvedValueOnce({
        success: true,
        dataSourceId: 'ds-100',
        version: 2,
        rowCount: 4,
        qualityScore: 98,
        message: 'Dataset successfully cleansed and saved as Version 2',
      });

      const res = await request(app)
        .post('/api/data-sources/ds-100/cleansing/apply')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          recipe: [
            { type: 'remove_duplicates' },
            { type: 'text_standardization', options: { column: 'name', operation: 'trim' } },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.qualityScore).toBe(98);
    });

    it('blocks viewers from applying transformations (RBAC check)', async () => {
      const res = await request(app)
        .post('/api/data-sources/ds-100/cleansing/apply')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ recipe: [{ type: 'remove_duplicates' }] });

      expect(res.status).toBe(403);
    });

    it('returns 403 FEATURE_NOT_INCLUDED when operation is locked on tenant plan', async () => {
      const lockError = new Error('Cleansing operation outlier_detection is not available on Free tier');
      lockError.statusCode = 403;
      lockError.code = 'FEATURE_NOT_INCLUDED';

      jest.spyOn(cleansingService, 'applyCleansing').mockRejectedValueOnce(lockError);

      const res = await request(app)
        .post('/api/data-sources/ds-100/cleansing/apply')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          recipe: [{ type: 'outlier_detection' }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/data-sources/:id/versions', () => {
    it('lists all versions and audit trail recipes', async () => {
      jest.spyOn(cleansingService, 'listVersions').mockResolvedValueOnce([
        {
          id: 'v-2',
          version_number: 2,
          isActive: true,
          row_count: 4,
          transformation_recipe: [{ type: 'remove_duplicates' }],
        },
        {
          id: 'v-1',
          version_number: 1,
          isActive: false,
          row_count: 5,
          transformation_recipe: [],
        },
      ]);

      const res = await request(app)
        .get('/api/data-sources/ds-100/versions')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].version_number).toBe(2);
      expect(res.body.data[0].isActive).toBe(true);
    });
  });

  describe('POST /api/data-sources/:id/versions/:versionNumber/revert', () => {
    it('reverts dataset to historical Version 1', async () => {
      jest.spyOn(cleansingService, 'revertVersion').mockResolvedValueOnce({
        success: true,
        dataSourceId: 'ds-100',
        currentVersion: 1,
        message: 'Successfully reverted dataset to Version 1',
      });

      const res = await request(app)
        .post('/api/data-sources/ds-100/versions/1/revert')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentVersion).toBe(1);
    });

    it('rejects revert from non-admin/owner roles with 403', async () => {
      const res = await request(app)
        .post('/api/data-sources/ds-100/versions/1/revert')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
