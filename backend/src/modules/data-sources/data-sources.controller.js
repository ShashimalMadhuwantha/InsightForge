const dataSourcesService = require('./data-sources.service');

class DataSourcesController {
  async uploadDataSource(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const file = req.file;
      const { name } = req.body;

      const result = await dataSourcesService.createDataSource(tenantId, file, { name }, req.user);
      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully and queued for schema parsing.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listDataSources(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { page, limit, search, status } = req.query;
      const result = await dataSourcesService.listDataSources(tenantId, {
        page,
        limit,
        search,
        status,
      });

      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getDataSourceById(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      const { id } = req.params;

      const result = await dataSourcesService.getDataSourceById(tenantId, id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDataSourceStatus(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      const { id } = req.params;

      const result = await dataSourcesService.getDataSourceById(tenantId, id);
      return res.status(200).json({
        success: true,
        data: {
          id: result.id,
          name: result.name,
          status: result.status,
          rowCount: result.row_count,
          columnCount: result.column_count,
          qualityMetrics: result.quality_metrics,
          errorMessage: result.error_message,
          updatedAt: result.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getDataSourcePreview(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

      const result = await dataSourcesService.getDataSourceSampleData(tenantId, id, limit);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async refreshDataSource(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      const { id } = req.params;
      const file = req.file;

      const result = await dataSourcesService.refreshDataSource(tenantId, id, file, req.user);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteDataSource(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenant_id || req.user?.tenantId;
      const { id } = req.params;

      const result = await dataSourcesService.deleteDataSource(tenantId, id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DataSourcesController();
