const migration = require('../migrations/20260906000002_create_tenants_users_packages');
const packageSeed = require('../seeds/02_default_packages');

describe('Tenant & User Schema Migration Suite', () => {
  it('exports up and down functions for knex migration runner', () => {
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('exports seed function for default package tiers', () => {
    expect(typeof packageSeed.seed).toBe('function');
  });
});
