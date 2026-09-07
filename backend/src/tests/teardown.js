const db = require('../common/config/db');
const { redisClient } = require('../common/config/redis');

module.exports = async () => {
  try {
    if (db && typeof db.destroy === 'function') {
      await db.destroy();
    }
    if (redisClient && typeof redisClient.quit === 'function') {
      await redisClient.quit();
    }
  } catch {
    // ignore
  }
};
