const path = require('path');
const config = require('./env');

const migrationsPath = path.resolve(__dirname, '../../db/migrations');
const seedsPath = path.resolve(__dirname, '../../db/seeds');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: migrationsPath,
      tableName: 'knex_migrations',
      extension: 'js',
    },
    seeds: {
      directory: seedsPath,
    },
  },

  test: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: migrationsPath,
      tableName: 'knex_migrations',
      extension: 'js',
    },
    seeds: {
      directory: seedsPath,
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: migrationsPath,
      tableName: 'knex_migrations',
      extension: 'js',
    },
    seeds: {
      directory: seedsPath,
    },
  },
};
