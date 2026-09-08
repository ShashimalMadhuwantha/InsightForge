const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { db } = require('../../common/config/db');
const entitlementService = require('../packages/entitlement.service');
const parserWorker = require('../data-sources/data-sources.worker');
const cleansingEngine = require('./cleansing.engine');

// Operation aliases to map recipe types to package entitlement names
const OP_MAP = {
  remove_duplicates: 'remove_duplicates',
  handle_missing: 'fill_missing',
  fill_missing: 'fill_missing',
  drop_missing: 'drop_missing',
  text_standardization: 'trim_whitespace',
  trim_spaces: 'trim_whitespace',
  lowercase: 'trim_whitespace',
  uppercase: 'trim_whitespace',
  titlecase: 'trim_whitespace',
  type_cast: 'standardize_types',
  standardize_types: 'standardize_types',
  drop_columns: 'standardize_types',
  drop_column: 'standardize_types',
  rename_columns: 'standardize_types',
  rename_column: 'standardize_types',
  filter_rows: 'standardize_types',
  outlier_detection: 'remove_outliers',
  remove_outliers: 'remove_outliers',
};

class CleansingService {
  /**
   * Normalize operator name to package limit representation
   */
  normalizeOp(opType) {
    return OP_MAP[opType] || opType;
  }

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
   * Load parsed rows from version file path
   */
  async loadVersionRows(filePath, fileType = 'csv') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dataset version file not found at: ${filePath}`);
    }

    if (filePath.endsWith('.json')) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }

    const { rows } = await parserWorker.parseRawFile(filePath, fileType);
    return rows;
  }

  /**
   * Dry-run preview of a cleansing recipe on sample dataset rows (Task 5.3 & 5.5)
   */
  async previewCleansing(tenantId, dataSourceId, recipe = []) {
    const ds = await db('data_sources')
      .where({ id: dataSourceId, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Data source not found');
      error.statusCode = 404;
      throw error;
    }

    // 1. Verify Entitlements for all recipe steps
    for (const step of recipe) {
      const mappedOp = this.normalizeOp(step.type);
      await entitlementService.assertFeature(tenantId, 'cleansing_op', mappedOp);
    }

    // 2. Fetch Active Version File
    const activeVersion = await db('data_source_versions')
      .where({ data_source_id: dataSourceId, version_number: ds.current_version })
      .first();

    if (!activeVersion) {
      const error = new Error('Active dataset version file not found');
      error.statusCode = 404;
      throw error;
    }

    const allRows = await this.loadVersionRows(activeVersion.file_path, ds.file_type);
    const sampleRows = allRows.slice(0, 100);

    // Initial Quality Metrics
    const initialQuality = parserWorker.analyzeQuality(sampleRows);

    // 3. Execute dry-run in CleansingEngine
    const { rows: transformedSample, telemetry } = cleansingEngine.applyRecipe(sampleRows, recipe);

    // Resulting Quality Metrics
    const resultingQuality = parserWorker.analyzeQuality(transformedSample);

    return {
      before: {
        rowCount: sampleRows.length,
        qualityScore: initialQuality.overallScore,
        completenessPct: initialQuality.completenessPct,
        missingCount: initialQuality.missingValuesCount,
        duplicateCount: initialQuality.duplicateRowsCount,
        sampleRows: sampleRows.slice(0, 25),
        schemaProfile: initialQuality.schemaProfile,
      },
      after: {
        rowCount: transformedSample.length,
        qualityScore: resultingQuality.overallScore,
        completenessPct: resultingQuality.completenessPct,
        missingCount: resultingQuality.missingValuesCount,
        duplicateCount: resultingQuality.duplicateRowsCount,
        sampleRows: transformedSample.slice(0, 25),
        schemaProfile: resultingQuality.schemaProfile,
      },
      telemetry,
    };
  }

  /**
   * Apply cleansing recipe, transform full dataset, and create immutable new version (Task 5.3 & 5.4)
   */
  async applyCleansing(tenantId, dataSourceId, recipe = [], user = null) {
    if (!recipe || recipe.length === 0) {
      const error = new Error('Recipe must contain at least one cleansing operation');
      error.statusCode = 400;
      throw error;
    }

    const ds = await db('data_sources')
      .where({ id: dataSourceId, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Data source not found');
      error.statusCode = 404;
      throw error;
    }

    // 1. Verify Entitlements
    for (const step of recipe) {
      const mappedOp = this.normalizeOp(step.type);
      await entitlementService.assertFeature(tenantId, 'cleansing_op', mappedOp);
    }

    // 2. Load Active Version
    const activeVersion = await db('data_source_versions')
      .where({ data_source_id: dataSourceId, version_number: ds.current_version })
      .first();

    if (!activeVersion) {
      const error = new Error('Active dataset version not found');
      error.statusCode = 404;
      throw error;
    }

    const fullRows = await this.loadVersionRows(activeVersion.file_path, ds.file_type);

    // 3. Apply Full Cleansing Recipe
    const { rows: transformedRows, telemetry } = cleansingEngine.applyRecipe(fullRows, recipe);
    const newQuality = parserWorker.analyzeQuality(transformedRows);

    // 4. Save Transformed Dataset to Disk
    const uploadDir = this.getTenantUploadDir(tenantId);
    const latestVerRecord = await db('data_source_versions')
      .where({ data_source_id: dataSourceId })
      .max('version_number as max_version')
      .first();
    const maxVer = latestVerRecord?.max_version ? parseInt(latestVerRecord.max_version, 10) : (ds.current_version || 1);
    const newVersionNumber = maxVer + 1;
    const newFileName = `${dataSourceId}_v${newVersionNumber}_${Date.now()}.json`;
    const targetFilePath = path.join(uploadDir, newFileName);

    fs.writeFileSync(targetFilePath, JSON.stringify(transformedRows), 'utf-8');
    const fileStats = fs.statSync(targetFilePath);

    // 5. Insert New Data Source Version (Preserves Immutability)
    const newVersionId = randomUUID();
    await db('data_source_versions').insert({
      id: newVersionId,
      data_source_id: dataSourceId,
      tenant_id: tenantId,
      version_number: newVersionNumber,
      file_path: targetFilePath,
      file_size_bytes: fileStats.size,
      row_count: newQuality.rowCount,
      schema_profile: JSON.stringify(newQuality.schemaProfile),
      quality_metrics: JSON.stringify({
        overall_score: newQuality.overallScore,
        missing_values_count: newQuality.missingValuesCount,
        duplicate_rows_count: newQuality.duplicateRowsCount,
        completeness_pct: newQuality.completenessPct,
      }),
      transformation_recipe: JSON.stringify(recipe),
      created_by: user?.id || null,
      created_at: new Date(),
    });

    // 6. Update Parent Data Source
    await db('data_sources')
      .where({ id: dataSourceId, tenant_id: tenantId })
      .update({
        current_version: newVersionNumber,
        status: 'ready',
        row_count: newQuality.rowCount,
        column_count: newQuality.columnCount,
        schema_profile: JSON.stringify(newQuality.schemaProfile),
        quality_metrics: JSON.stringify({
          overall_score: newQuality.overallScore,
          missing_values_count: newQuality.missingValuesCount,
          duplicate_rows_count: newQuality.duplicateRowsCount,
          completeness_pct: newQuality.completenessPct,
        }),
        updated_at: new Date(),
      });

    return {
      success: true,
      dataSourceId,
      version: newVersionNumber,
      rowCount: newQuality.rowCount,
      qualityScore: newQuality.overallScore,
      telemetry,
      message: `Dataset successfully cleansed and saved as Version ${newVersionNumber}`,
    };
  }

  /**
   * List all versions and their recipe audit trails (Task 5.5)
   */
  async listVersions(tenantId, dataSourceId) {
    const ds = await db('data_sources')
      .where({ id: dataSourceId, tenant_id: tenantId })
      .first();

    if (!ds) {
      const error = new Error('Data source not found');
      error.statusCode = 404;
      throw error;
    }

    const versions = await db('data_source_versions')
      .where({ data_source_id: dataSourceId, tenant_id: tenantId })
      .orderBy('version_number', 'desc');

    return versions.map((v) => ({
      ...v,
      isActive: v.version_number === ds.current_version,
      schema_profile: typeof v.schema_profile === 'string' ? JSON.parse(v.schema_profile) : v.schema_profile,
      quality_metrics: typeof v.quality_metrics === 'string' ? JSON.parse(v.quality_metrics) : v.quality_metrics,
      transformation_recipe: typeof v.transformation_recipe === 'string' ? JSON.parse(v.transformation_recipe) : v.transformation_recipe || [],
    }));
  }

  /**
   * Revert dataset to any previous version (Task 5.5 & 5.7)
   */
  async revertVersion(tenantId, dataSourceId, targetVersionNumber) {
    const vNum = parseInt(targetVersionNumber, 10);
    if (isNaN(vNum) || vNum < 1) {
      const error = new Error('Invalid version number');
      error.statusCode = 400;
      throw error;
    }

    const targetVersion = await db('data_source_versions')
      .where({ data_source_id: dataSourceId, tenant_id: tenantId, version_number: vNum })
      .first();

    if (!targetVersion) {
      const error = new Error(`Version ${vNum} does not exist for this dataset`);
      error.statusCode = 404;
      throw error;
    }

    const schemaProfile = typeof targetVersion.schema_profile === 'string'
      ? targetVersion.schema_profile
      : JSON.stringify(targetVersion.schema_profile || []);

    const qualityMetrics = typeof targetVersion.quality_metrics === 'string'
      ? targetVersion.quality_metrics
      : JSON.stringify(targetVersion.quality_metrics || {});

    const parsedSchema = JSON.parse(schemaProfile);

    // Update parent data_sources to point back to the chosen version
    await db('data_sources')
      .where({ id: dataSourceId, tenant_id: tenantId })
      .update({
        current_version: vNum,
        row_count: targetVersion.row_count,
        column_count: parsedSchema.length,
        schema_profile: schemaProfile,
        quality_metrics: qualityMetrics,
        status: 'ready',
        updated_at: new Date(),
      });

    return {
      success: true,
      dataSourceId,
      currentVersion: vNum,
      message: `Successfully reverted dataset to Version ${vNum}`,
    };
  }
}

module.exports = new CleansingService();
