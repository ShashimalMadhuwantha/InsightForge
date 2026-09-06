const app = require('./app');
const config = require('./common/config/env');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 InsightForge Backend running on port ${PORT} [${config.env}]`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
