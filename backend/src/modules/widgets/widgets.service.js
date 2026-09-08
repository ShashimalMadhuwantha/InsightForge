const fs = require('fs');
const { randomUUID } = require('crypto');
const db = require('../../common/config/db');
const widgetsEngine = require('./widgets.engine');
const entitlementService = require('../packages/entitlement.service');
const parserWorker = require('../data-sources/data-sources.worker');

class WidgetsService {
  /**
   * Helper: Load dataset records from storage file (JSON or raw XLSX/CSV)
   */
  async loadVersionRows(filePath, fileType = 'json') {
    if (!fs.existsSync(filePath)) {
      const error = new Error(`Dataset version file not found at path: ${filePath}`);
      error.statusCode = 404;
      throw error;
    }

    if (filePath.endsWith('.json') || fileType === 'json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }

    return parserWorker.parseFile(filePath, fileType);
  }

  /**
   * List tenant widgets with optional search and filters (Task 6.3)
   */
  async listWidgets(tenantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      dataSourceId = null,
      type = null,
    } = options;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    let query = db('widgets as w')
      .leftJoin('data_sources as ds', 'w.data_source_id', 'ds.id')
      .where('w.tenant_id', tenantId)
      .select(
        'w.id',
        'w.tenant_id',
        'w.data_source_id',
        'w.version_id',
        'w.title',
        'w.description',
        'w.type',
        'w.config',
        'w.created_by',
        'w.created_at',
        'w.updated_at',
        'ds.name as data_source_name',
        'ds.file_type as data_source_file_type',
        'ds.current_version as data_source_current_version'
      );

    if (search) {
      query = query.where((builder) => {
        builder.whereILike('w.title', `%${search}%`)
          .orWhereILike('w.description', `%${search}%`)
          .orWhereILike('ds.name', `%${search}%`);
      });
    }

    if (dataSourceId) {
      query = query.where('w.data_source_id', dataSourceId);
    }

    if (type) {
      query = query.where('w.type', type);
    }

    const countQuery = db('widgets as w')
      .where('w.tenant_id', tenantId);

    if (search) {
      countQuery.where((b) => {
        b.whereILike('w.title', `%${search}%`).orWhereILike('w.description', `%${search}%`);
      });
    }
    if (dataSourceId) countQuery.where('w.data_source_id', dataSourceId);
    if (type) countQuery.where('w.type', type);

    const [{ count }] = await countQuery.count('id as count');
    const total = parseInt(count, 10);

    const widgets = await query
      .orderBy('w.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const parsedWidgets = widgets.map((w) => ({
      ...w,
      config: typeof w.config === 'string' ? JSON.parse(w.config) : w.config,
    }));

    return {
      widgets: parsedWidgets,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get widget details by ID (Task 6.3)
   */
  async getWidgetById(tenantId, widgetId) {
    const widget = await db('widgets as w')
      .leftJoin('data_sources as ds', 'w.data_source_id', 'ds.id')
      .where({ 'w.id': widgetId, 'w.tenant_id': tenantId })
      .select(
        'w.*',
        'ds.name as data_source_name',
        'ds.file_type as data_source_file_type',
        'ds.current_version as data_source_current_version'
      )
      .first();

    if (!widget) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      ...widget,
      config: typeof widget.config === 'string' ? JSON.parse(widget.config) : widget.config,
    };
  }

  /**
   * Create a new widget with entitlement assertions (Task 6.3 & 6.4)
   */
  async createWidget(tenantId, payload, user = null) {
    const {
      title,
      description = null,
      data_source_id,
      version_id = null,
      type,
      config = {},
    } = payload;

    if (!title || !title.trim()) {
      const error = new Error('Widget title is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data_source_id) {
      const error = new Error('data_source_id is required');
      error.statusCode = 400;
      throw error;
    }

    if (!type) {
      const error = new Error('Widget type is required');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify Data Source belongs to tenant
    const ds = await db('data_sources')
      .where({ id: data_source_id, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Target data source not found or does not belong to tenant');
      error.statusCode = 404;
      throw error;
    }

    // 2. Package Entitlement Check (Task 6.4)
    await entitlementService.assertFeature(tenantId, 'widget_type', type.toLowerCase());

    const id = randomUUID();
    const newWidget = {
      id,
      tenant_id: tenantId,
      data_source_id,
      version_id,
      title: title.trim(),
      description: description ? description.trim() : null,
      type: type.toLowerCase(),
      config: typeof config === 'string' ? config : JSON.stringify(config),
      created_by: user?.id || null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db('widgets').insert(newWidget);

    return this.getWidgetById(tenantId, id);
  }

  /**
   * Update an existing widget (Task 6.3)
   */
  async updateWidget(tenantId, widgetId, payload) {
    const existing = await db('widgets')
      .where({ id: widgetId, tenant_id: tenantId })
      .first();

    if (!existing) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }

    const updates = {
      updated_at: new Date(),
    };

    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.description !== undefined) updates.description = payload.description;

    if (payload.type !== undefined) {
      const newType = payload.type.toLowerCase();
      // Assert feature for updated type
      await entitlementService.assertFeature(tenantId, 'widget_type', newType);
      updates.type = newType;
    }

    if (payload.config !== undefined) {
      updates.config = typeof payload.config === 'string' ? payload.config : JSON.stringify(payload.config);
    }

    if (payload.version_id !== undefined) {
      updates.version_id = payload.version_id;
    }

    await db('widgets')
      .where({ id: widgetId, tenant_id: tenantId })
      .update(updates);

    return this.getWidgetById(tenantId, widgetId);
  }

  /**
   * Delete a widget (Task 6.3)
   */
  async deleteWidget(tenantId, widgetId) {
    const count = await db('widgets')
      .where({ id: widgetId, tenant_id: tenantId })
      .del();

    if (!count) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }

    return { success: true, id: widgetId };
  }

  /**
   * Execute widget query and return computed chart-ready dataset (Task 6.3)
   * Supports saved widget execution OR ad-hoc config preview from studio
   */
  async executeWidgetQuery(tenantId, params = {}) {
    const startTime = Date.now();
    const {
      widgetId = null,
      dataSourceId = null,
      versionId = null,
      config = null,
      type = null,
    } = params;

    let targetDataSourceId = dataSourceId;
    let targetVersionId = versionId;
    let targetConfig = config;
    let targetType = type;

    // If widgetId supplied, retrieve its stored configuration
    if (widgetId) {
      const widget = await db('widgets')
        .where({ id: widgetId, tenant_id: tenantId })
        .first();

      if (!widget) {
        const error = new Error('Widget not found');
        error.statusCode = 404;
        throw error;
      }

      targetDataSourceId = widget.data_source_id;
      targetVersionId = widget.version_id;
      targetType = widget.type;
      targetConfig = typeof widget.config === 'string' ? JSON.parse(widget.config) : widget.config;
    }

    if (!targetDataSourceId) {
      const error = new Error('dataSourceId or widgetId is required to execute query');
      error.statusCode = 400;
      throw error;
    }

    // Assert package entitlement for widget type if specified
    if (targetType) {
      await entitlementService.assertFeature(tenantId, 'widget_type', targetType.toLowerCase());
    }

    // Verify Data Source ownership
    const ds = await db('data_sources')
      .where({ id: targetDataSourceId, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Data source not found');
      error.statusCode = 404;
      throw error;
    }

    // Determine target version record
    let versionRecord;
    if (targetVersionId) {
      versionRecord = await db('data_source_versions')
        .where({ id: targetVersionId, data_source_id: targetDataSourceId })
        .first();
    } else {
      versionRecord = await db('data_source_versions')
        .where({ data_source_id: targetDataSourceId, version_number: ds.current_version })
        .first();
    }

    if (!versionRecord) {
      const error = new Error('Active dataset version not found');
      error.statusCode = 404;
      throw error;
    }

    // Load full rows
    const rows = await this.loadVersionRows(versionRecord.file_path, ds.file_type);

    let queryResult;
    if (targetType === 'kpi') {
      queryResult = widgetsEngine.computeKpi(rows, targetConfig || {});
    } else {
      queryResult = widgetsEngine.aggregateData(rows, targetConfig || {});
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      widgetType: targetType || 'bar',
      queryResult,
      executionTimeMs,
      dataSource: {
        id: ds.id,
        name: ds.name,
        currentVersion: ds.current_version,
        rowCount: versionRecord.row_count,
      },
    };
  }

  /**
   * Get smart chart suggestions for a dataset (Task 6.2 & 6.4)
   */
  async getSuggestions(tenantId, dataSourceId) {
    const ds = await db('data_sources')
      .where({ id: dataSourceId, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Data source not found');
      error.statusCode = 404;
      throw error;
    }

    const schemaProfile = typeof ds.schema_profile === 'string'
      ? JSON.parse(ds.schema_profile)
      : (ds.schema_profile || []);

    const rawSuggestions = widgetsEngine.suggestChartTypes(schemaProfile);

    // Annotate suggestions with package tier lock status
    const annotated = await Promise.all(
      rawSuggestions.map(async (sugg) => {
        const featureCheck = await entitlementService.checkFeature(tenantId, 'widget_type', sugg.type);
        return {
          ...sugg,
          isLocked: !featureCheck.allowed,
          tierMessage: featureCheck.message,
        };
      })
    );

    return {
      dataSourceId,
      dataSourceName: ds.name,
      schemaProfile,
      suggestions: annotated,
    };
  }
}

module.exports = new WidgetsService();
