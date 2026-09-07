/**
 * Migration: Create Audit Logs table and support Super Admin users
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Audit Logs Table
  const hasAuditLogs = await knex.schema.hasTable('audit_logs');
  if (!hasAuditLogs) {
    await knex.schema.createTable('audit_logs', (table) => {
      table.uuid('id').primary();
      table.uuid('admin_user_id').notNullable();
      table.uuid('target_tenant_id').nullable();
      table.string('action', 128).notNullable();
      table.jsonb('details').nullable();
      table.string('ip_address', 64).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['target_tenant_id'], 'idx_audit_logs_target_tenant_id');
      table.index(['admin_user_id'], 'idx_audit_logs_admin_user_id');
      table.index(['action'], 'idx_audit_logs_action');
      table.index(['created_at'], 'idx_audit_logs_created_at');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
