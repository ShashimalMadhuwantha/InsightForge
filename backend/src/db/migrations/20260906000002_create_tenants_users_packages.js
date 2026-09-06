/**
 * Migration: Create Packages, Tenants, and Users tables
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Packages Table
  const hasPackages = await knex.schema.hasTable('packages');
  if (!hasPackages) {
    await knex.schema.createTable('packages', (table) => {
      table.string('id', 64).primary();
      table.string('name', 128).notNullable();
      table.string('tier', 64).notNullable();
      table.jsonb('limits').notNullable();
      table.decimal('price_monthly', 10, 2).defaultTo(0.00);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Tenants Table
  const hasTenants = await knex.schema.hasTable('tenants');
  if (!hasTenants) {
    await knex.schema.createTable('tenants', (table) => {
      table.uuid('id').primary();
      table.string('name', 255).notNullable();
      table.string('package_id', 64).references('id').inTable('packages').onDelete('SET NULL');
      table.string('status', 32).notNullable().defaultTo('active');
      table.string('contact_email', 255).nullable();
      table.string('contact_phone', 64).nullable();
      table.text('logo_url').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 3. Users Table (with multi-tenant scoping via tenant_id)
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('email', 255).notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 128).nullable();
      table.string('last_name', 128).nullable();
      table.string('role', 32).notNullable().defaultTo('viewer'); // owner, admin, analyst, viewer
      table.string('status', 32).notNullable().defaultTo('active'); // active, inactive, suspended
      table.timestamp('last_login_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['tenant_id', 'email']);
      table.index(['tenant_id'], 'idx_users_tenant_id');
      table.index(['email'], 'idx_users_email');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');
  await knex.schema.dropTableIfExists('packages');
};
