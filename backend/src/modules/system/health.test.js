const request = require('supertest');
const app = require('../../app');
const dbModule = require('../../common/config/db');
const redisModule = require('../../common/config/redis');
const { formatUptime } = require('./health.service');

describe('Health Check Module Integration & Unit Suite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('formatUptime utility', () => {
    it('formats seconds into readable strings correctly', () => {
      expect(formatUptime(45)).toBe('45s');
      expect(formatUptime(125)).toBe('2m 5s');
      expect(formatUptime(3665)).toBe('1h 1m 5s');
      expect(formatUptime(90065)).toBe('1d 1h 1m 5s');
    });
  });

  describe('GET /ping', () => {
    it('returns 200 OK with pong property', async () => {
      const res = await request(app).get('/ping');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pong', true);
    });
  });

  describe('GET /health & /api/health', () => {
    it('returns 200 OK when both DB and Redis are healthy', async () => {
      jest.spyOn(dbModule, 'checkDbHealth').mockResolvedValueOnce({ status: 'healthy' });
      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValueOnce({ status: 'healthy' });

      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body.services.db).toBe('healthy');
      expect(res.body.services.redis).toBe('healthy');
      expect(res.body).toHaveProperty('uptimeFormatted');
    });

    it('returns 503 Service Unavailable when DB is unhealthy', async () => {
      jest.spyOn(dbModule, 'checkDbHealth').mockResolvedValueOnce({ 
        status: 'unhealthy', 
        error: 'Connection refused' 
      });
      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValueOnce({ status: 'healthy' });

      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.services.db).toBe('unhealthy');
      expect(res.body.services.dbError).toBe('Connection refused');
    });

    it('returns 503 Service Unavailable when Redis is unhealthy', async () => {
      jest.spyOn(dbModule, 'checkDbHealth').mockResolvedValueOnce({ status: 'healthy' });
      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValueOnce({ 
        status: 'unhealthy', 
        error: 'Redis timeout' 
      });

      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.services.redis).toBe('unhealthy');
      expect(res.body.services.redisError).toBe('Redis timeout');
    });
  });
});
