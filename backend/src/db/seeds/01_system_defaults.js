/**
 * System Baseline Seed
 * Inserts default system metadata values for environment and schema verification
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const hasTable = await knex.schema.hasTable('system_metadata');
  if (hasTable) {
    // Upsert baseline system metadata keys
    await knex('system_metadata')
      .insert([
        { key: 'platform_name', value: 'InsightForge BI SaaS', description: 'System application name' },
        { key: 'platform_version', value: '1.0.0', description: 'Installed semantic version' },
        { key: 'schema_version', value: '2026.09.01', description: 'Current DB schema build' },
      ])
      .onConflict('key')
      .merge();
  }
};
