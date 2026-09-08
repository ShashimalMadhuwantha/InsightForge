const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { db } = require('../../common/config/db');
const entitlementService = require('../packages/entitlement.service');
const parserWorker = require('./data-sources.worker');

class DataSourcesService {
  /**
   * Helper to ensure tenant storage directory exists
   */
  getTenantUploadDir(tenantId) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tenants', tenantId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  /**
   * List all data sources for a tenant with pagination and search
   */
  async listDataSources(tenantId, { page = 1, limit = 20, search = '', status = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = db('data_sources')
      .where('tenant_id', tenantId)
      .select('*');

    if (search) {
      query = query.where((builder) => {
        builder.whereILike('name', `%${search}%`)
          .orWhereILike('original_filename', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('status', status);
    }

    let countQuery = db('data_sources').where('tenant_id', tenantId);
    if (search) {
      countQuery = countQuery.where((builder) => {
        builder.whereILike('name', `%${search}%`)
          .orWhereILike('original_filename', `%${search}%`);
      });
    }
    if (status) {
      countQuery = countQuery.where('status', status);
    }

    const countRes = await countQuery.count('id as total').first();
    const total = parseInt(countRes?.total || 0, 10);

    const items = await query.orderBy('created_at', 'desc').limit(limitNum).offset(offset);

    return {
      dataSources: items.map((item) => ({
        ...item,
        schema_profile: typeof item.schema_profile === 'string' ? JSON.parse(item.schema_profile) : item.schema_profile,
        quality_metrics: typeof item.quality_metrics === 'string' ? JSON.parse(item.quality_metrics) : item.quality_metrics,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get single data source details with schema profile and version history
   */
  async getDataSourceById(tenantId, id) {
    const ds = await db('data_sources')
      .where({ id, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Data source not found');
      error.statusCode = 404;
      throw error;
    }

    const versions = await db('data_source_versions')
      .where({ data_source_id: id, tenant_id: tenantId })
      .orderBy('version_number', 'desc');

    return {
      ...ds,
      schema_profile: typeof ds.schema_profile === 'string' ? JSON.parse(ds.schema_profile) : ds.schema_profile,
      quality_metrics: typeof ds.quality_metrics === 'string' ? JSON.parse(ds.quality_metrics) : ds.quality_metrics,
      versions: versions.map((v) => ({
        ...v,
        row_count: v.row_count > 0 ? v.row_count : (v.version_number === ds.current_version ? ds.row_count : 0),
        schema_profile: typeof v.schema_profile === 'string' ? JSON.parse(v.schema_profile) : v.schema_profile,
        quality_metrics: typeof v.quality_metrics === 'string' ? JSON.parse(v.quality_metrics) : v.quality_metrics,
      })),
    };
  }

  /**
   * Upload & ingest new dataset (Task 4.2 & 4.3)
   */
  async createDataSource(tenantId, file, { name = '' } = {}, user = null) {
    if (!file) {
      const error = new Error('Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.');
      error.statusCode = 400;
      throw error;
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const validTypes = ['xlsx', 'xls', 'csv'];
    if (!validTypes.includes(ext)) {
      const error = new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv');
      error.statusCode = 400;
      throw error;
    }

    // 1. Enforce Entitlement Limits (Data Sources count + File Size MB)
    const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    await entitlementService.assertLimit(tenantId, 'data_sources', 1);
    await entitlementService.assertLimit(tenantId, 'file_size_mb', fileSizeMb);

    // 2. Persist File in Tenant Isolated Directory
    const uploadDir = this.getTenantUploadDir(tenantId);
    const dataSourceId = randomUUID();
    const versionId = randomUUID();
    const storedFilename = `${dataSourceId}_v1_${Date.now()}.${ext}`;
    const targetFilePath = path.join(uploadDir, storedFilename);

    if (file.path) {
      fs.copyFileSync(file.path, targetFilePath);
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore tmp unlink error
      }
    } else if (file.buffer) {
      fs.writeFileSync(targetFilePath, file.buffer);
    }

    const dsName = name.trim() || path.basename(file.originalname, path.extname(file.originalname));

    // 3. Insert Data Source Record (Initial 'processing' status)
    const [dataSource] = await db('data_sources')
      .insert({
        id: dataSourceId,
        tenant_id: tenantId,
        name: dsName,
        file_type: ext,
        original_filename: file.originalname,
        current_version: 1,
        status: 'processing',
        row_count: 0,
        column_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // 4. Insert Initial Version Record
    await db('data_source_versions').insert({
      id: versionId,
      data_source_id: dataSourceId,
      tenant_id: tenantId,
      version_number: 1,
      file_path: targetFilePath,
      file_size_bytes: file.size,
      created_by: user?.id || null,
      created_at: new Date(),
    });

    // 5. Trigger Background Parsing Worker
    // Execute worker in next tick or background
    parserWorker.processDataSource(dataSourceId, targetFilePath, ext).catch((err) => {
      console.error(`[Worker Error] Processing data source ${dataSourceId}:`, err.message);
    });

    return dataSource;
  }

  /**
   * Get sample tabular preview data (Task 4.7 preview)
   */
  async getDataSourceSampleData(tenantId, id, limit = 50) {
    const ds = await this.getDataSourceById(tenantId, id);
    const activeVersion = ds.versions?.[0];

    if (!activeVersion || !activeVersion.file_path) {
      return { rows: [], columns: [] };
    }

    const { rows } = await parserWorker.parseRawFile(activeVersion.file_path, ds.file_type);
    const sampleRows = rows.slice(0, Math.min(100, Math.max(1, limit)));
    const columns = ds.schema_profile || [];

    return {
      totalRows: ds.row_count || rows.length,
      sampleRows,
      columns,
    };
  }

  /**
   * Refresh / Re-upload dataset creating a new version (Task 4.9)
   */
  async refreshDataSource(tenantId, id, file, user = null) {
    const ds = await this.getDataSourceById(tenantId, id);

    if (!file) {
      const error = new Error('Please upload a file to refresh the dataset.');
      error.statusCode = 400;
      throw error;
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    await entitlementService.assertLimit(tenantId, 'file_size_mb', fileSizeMb);

    const latestVerRecord = await db('data_source_versions')
      .where({ data_source_id: id })
      .max('version_number as max_version')
      .first();
    const maxVer = latestVerRecord?.max_version ? parseInt(latestVerRecord.max_version, 10) : (ds.current_version || 1);
    const newVersionNumber = maxVer + 1;
    const uploadDir = this.getTenantUploadDir(tenantId);
    const storedFilename = `${id}_v${newVersionNumber}_${Date.now()}.${ext}`;
    const targetFilePath = path.join(uploadDir, storedFilename);

    if (file.path) {
      fs.copyFileSync(file.path, targetFilePath);
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore tmp unlink error
      }
    } else if (file.buffer) {
      fs.writeFileSync(targetFilePath, file.buffer);
    }

    const versionId = randomUUID();

    // Insert new version record
    await db('data_source_versions').insert({
      id: versionId,
      data_source_id: id,
      tenant_id: tenantId,
      version_number: newVersionNumber,
      file_path: targetFilePath,
      file_size_bytes: file.size,
      created_by: user?.id || null,
      created_at: new Date(),
    });

    // Update parent data source
    await db('data_sources')
      .where({ id, tenant_id: tenantId })
      .update({
        current_version: newVersionNumber,
        original_filename: file.originalname,
        file_type: ext,
        status: 'processing',
        updated_at: new Date(),
      });

    // Trigger parser worker
    parserWorker.processDataSource(id, targetFilePath, ext).catch((err) => {
      console.error(`[Worker Error] Refreshing data source ${id}:`, err.message);
    });

    return {
      id,
      version: newVersionNumber,
      status: 'processing',
      message: `Dataset refresh started for version ${newVersionNumber}`,
    };
  }

  /**
   * Delete data source and its versions
   */
  async deleteDataSource(tenantId, id) {
    const ds = await this.getDataSourceById(tenantId, id);

    // Delete physical files
    if (ds.versions) {
      for (const v of ds.versions) {
        if (v.file_path && fs.existsSync(v.file_path)) {
          try {
            fs.unlinkSync(v.file_path);
          } catch {
            // ignore unlink error
          }
        }
      }
    }

    await db('data_sources')
      .where({ id, tenant_id: tenantId })
      .delete();

    return { id, message: 'Data source successfully deleted' };
  }
}

module.exports = new DataSourcesService();
