const { db, checkDbHealth } = require('../db');

describe('Database Connection Module', () => {
  afterAll(async () => {
    await db.destroy();
  });

  it('should initialize knex client with correct configuration', () => {
    expect(db).toBeDefined();
    expect(typeof db.raw).toBe('function');
    expect(typeof db.migrate.latest).toBe('function');
  });

  it('checkDbHealth returns healthy or unhealthy status object without throwing unhandled exceptions', async () => {
    const health = await checkDbHealth();
    expect(health).toHaveProperty('status');
    expect(['healthy', 'unhealthy']).toContain(health.status);
  });
});
