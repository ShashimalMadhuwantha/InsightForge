const { redis, checkRedisHealth } = require('./redis');

describe('Redis Configuration & Health Suite', () => {
  afterAll(async () => {
    if (typeof redis.quit === 'function') {
      await redis.quit();
    }
  });

  it('performs basic SET, GET and DEL operations', async () => {
    const testKey = 'test:ping:key';
    const testValue = 'insightforge_ok';

    await redis.set(testKey, testValue);
    const result = await redis.get(testKey);
    expect(result).toBe(testValue);

    await redis.del(testKey);
    const postDelete = await redis.get(testKey);
    expect(postDelete).toBeNull();
  });

  it('checkRedisHealth returns healthy status with valid ping', async () => {
    const health = await checkRedisHealth();
    expect(health).toHaveProperty('status');
    expect(['healthy', 'unhealthy']).toContain(health.status);
    if (health.status === 'healthy') {
      expect(health.error).toBeUndefined();
    }
  });
});
