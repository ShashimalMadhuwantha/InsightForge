const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');
const config = require('./env');

let redis;

if (config.env === 'test' && process.env.USE_REAL_REDIS !== 'true') {
  redis = new RedisMock();
} else {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });

  redis.on('error', (err) => {
    if (config.env !== 'test') {
      console.warn(`[Redis Warning] Connection issue: ${err.message}`);
    }
  });
}

async function checkRedisHealth() {
  try {
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      return { status: 'healthy', latency: null };
    }
    return { status: 'unhealthy', error: `Unexpected ping response: ${pingResult}` };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

module.exports = {
  redis,
  checkRedisHealth,
};
