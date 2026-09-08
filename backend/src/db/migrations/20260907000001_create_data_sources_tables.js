/**
 * Migration: Create Data Sources & Data Source Versions tables
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Data Sources Table
  const hasDataSources = await knex.schema.hasTable('data_sources');
  if (!hasDataSources) {
    await knex.schema.createTable('data_sources', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('file_type', 32).notNullable().defaultTo('xlsx');
      table.string('original_filename', 255).notNullable();
      table.integer('current_version').notNullable().defaultTo(1);
      table.string('status', 32).notNullable().defaultTo('uploading'); // uploading, processing, ready, error, cleansed
      table.integer('row_count').notNullable().defaultTo(0);
      table.integer('column_count').notNullable().defaultTo(0);
      table.jsonb('schema_profile').nullable();
      table.jsonb('quality_metrics').nullable();
      table.text('error_message').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['tenant_id'], 'idx_data_sources_tenant_id');
      table.index(['status'], 'idx_data_sources_status');
      table.index(['created_at'], 'idx_data_sources_created_at');
    });
  }

  // 2. Data Source Versions Table (Version History & Re-upload Support)
  const hasDataSourceVersions = await knex.schema.hasTable('data_source_versions');
  if (!hasDataSourceVersions) {
    await knex.schema.createTable('data_source_versions', (table) => {
      table.uuid('id').primary();
      table.uuid('data_source_id').notNullable().references('id').inTable('data_sources').onDelete('CASCADE');
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('version_number').notNullable().defaultTo(1);
      table.string('file_path', 500).notNullable();
      table.bigInteger('file_size_bytes').notNullable().defaultTo(0);
      table.integer('row_count').notNullable().defaultTo(0);
      table.jsonb('schema_profile').nullable();
      table.jsonb('quality_metrics').nullable();
      table.uuid('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['data_source_id'], 'idx_data_source_versions_ds_id');
      table.index(['tenant_id'], 'idx_data_source_versions_tenant_id');
      table.unique(['data_source_id', 'version_number']);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('data_source_versions');
  await knex.schema.dropTableIfExists('data_sources');
};
