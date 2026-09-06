const config = require('./env');

describe('Environment Configuration Module', () => {
  it('loads valid default configurations', () => {
    expect(config).toBeDefined();
    expect(config.env).toBe('test');
    expect(config.port).toBeGreaterThan(0);
    expect(config.db).toBeDefined();
    expect(config.db.host).toBeDefined();
    expect(config.redis).toBeDefined();
    expect(config.redis.host).toBeDefined();
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
  });
});
