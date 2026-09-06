const dbConfig = require('../../common/config/db');
const redisConfig = require('../../common/config/redis');
const config = require('../../common/config/env');

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
};

async function getSystemHealth() {
  const [dbHealth, redisHealth] = await Promise.all([
    dbConfig.checkDbHealth(),
    redisConfig.checkRedisHealth(),
  ]);

  const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy';
  const uptimeSeconds = process.uptime();

  return {
    status: isHealthy ? 'ok' : 'degraded',
    statusCode: isHealthy ? 200 : 503,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    environment: config.env,
    services: {
      db: dbHealth.status,
      redis: redisHealth.status,
      ...(dbHealth.error && { dbError: dbHealth.error }),
      ...(redisHealth.error && { redisError: redisHealth.error }),
    },
  };
}

module.exports = {
  getSystemHealth,
  formatUptime,
};
