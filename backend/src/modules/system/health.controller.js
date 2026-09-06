const { getSystemHealth } = require('./health.service');

async function getHealth(req, res, next) {
  try {
    const health = await getSystemHealth();
    res.status(health.statusCode).json(health);
  } catch (error) {
    next(error);
  }
}

async function getPing(req, res) {
  res.status(200).json({ status: 'ok', pong: true, timestamp: new Date().toISOString() });
}

module.exports = {
  getHealth,
  getPing,
};
