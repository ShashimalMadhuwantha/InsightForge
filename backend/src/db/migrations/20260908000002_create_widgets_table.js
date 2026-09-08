/**
 * Migration: Create Widgets table for BI Visualizations (Epic 6 Task 6.1)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasWidgets = await knex.schema.hasTable('widgets');
  if (!hasWidgets) {
    await knex.schema.createTable('widgets', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.uuid('data_source_id').notNullable().references('id').inTable('data_sources').onDelete('CASCADE');
      table.uuid('version_id').nullable().references('id').inTable('data_source_versions').onDelete('SET NULL');
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.string('type', 50).notNullable(); // 'bar', 'line', 'area', 'pie', 'donut', 'scatter', 'kpi', 'table', 'gauge'
      table.jsonb('config').notNullable().defaultTo('{}');
      table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      // Multi-tenant and query indexes
      table.index(['tenant_id'], 'idx_widgets_tenant_id');
      table.index(['data_source_id'], 'idx_widgets_data_source_id');
      table.index(['type'], 'idx_widgets_type');
      table.index(['tenant_id', 'data_source_id'], 'idx_widgets_tenant_datasource');
      table.index(['tenant_id', 'created_at'], 'idx_widgets_tenant_created');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('widgets');
};
