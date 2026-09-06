/**
 * Initial Schema Migration
 * Establishes baseline schema verification and system metadata tracking table
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('system_metadata');
  if (!hasTable) {
    await knex.schema.createTable('system_metadata', (table) => {
      table.string('key', 128).primary();
      table.text('value').notNullable();
      table.string('description', 255).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('system_metadata');
};
