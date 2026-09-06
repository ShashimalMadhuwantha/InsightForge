const knex = require('knex');
const config = require('./env');
const knexConfig = require('./knexfile');

const environment = config.env === 'test' ? 'test' : config.env === 'production' ? 'production' : 'development';
const db = knex(knexConfig[environment]);

async function checkDbHealth() {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', latency: null };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

module.exports = {
  db,
  checkDbHealth,
};
