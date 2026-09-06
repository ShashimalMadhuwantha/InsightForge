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

  // 2. Ensure system tenant exists or allow nullable tenant_id on users if needed
  const hasSystemTenant = await knex('tenants').where('id', '00000000-0000-0000-0000-000000000000').first();
  if (!hasSystemTenant) {
    await knex('tenants').insert({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'InsightForge Platform Administration',
      package_id: 'enterprise',
      status: 'active',
      contact_email: 'admin@insightforge.internal',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex('tenants').where('id', '00000000-0000-0000-0000-000000000000').del();
};
