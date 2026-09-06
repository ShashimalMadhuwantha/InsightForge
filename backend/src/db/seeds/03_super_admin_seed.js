const { hashPassword } = require('../../common/utils/password');

/**
 * Seed: Platform Super Admin user
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Ensure system tenant exists
  const systemTenantId = '00000000-0000-0000-0000-000000000000';
  const existingTenant = await knex('tenants').where('id', systemTenantId).first();
  if (!existingTenant) {
    await knex('tenants').insert({
      id: systemTenantId,
      name: 'InsightForge Platform Administration',
      package_id: 'enterprise',
      status: 'active',
      contact_email: 'admin@insightforge.internal',
    });
  }

  const superAdminEmail = 'admin@insightforge.internal';
  const existingAdmin = await knex('users')
    .where({ email: superAdminEmail, tenant_id: systemTenantId })
    .first();

  const defaultPasswordHash = await hashPassword('SuperAdmin#2026!');

  if (!existingAdmin) {
    await knex('users').insert({
      id: '00000000-0000-0000-0000-000000000001',
      tenant_id: systemTenantId,
      email: superAdminEmail,
      password_hash: defaultPasswordHash,
      first_name: 'Platform',
      last_name: 'Administrator',
      role: 'super_admin',
      status: 'active',
    });
  } else {
    await knex('users')
      .where({ id: existingAdmin.id })
      .update({
        role: 'super_admin',
        status: 'active',
        password_hash: defaultPasswordHash,
      });
  }
};
