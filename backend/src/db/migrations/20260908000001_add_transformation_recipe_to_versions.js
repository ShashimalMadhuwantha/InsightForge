/**
 * Migration: Add transformation_recipe column to data_source_versions table
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('data_source_versions');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('data_source_versions', 'transformation_recipe');
    if (!hasColumn) {
      await knex.schema.alterTable('data_source_versions', (table) => {
        table.jsonb('transformation_recipe').nullable();
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('data_source_versions');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('data_source_versions', 'transformation_recipe');
    if (hasColumn) {
      await knex.schema.alterTable('data_source_versions', (table) => {
        table.dropColumn('transformation_recipe');
      });
    }
  }
};
