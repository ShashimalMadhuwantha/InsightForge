const request = require('supertest');
const app = require('../app');

describe('Backend Skeleton & App Base Suite', () => {
  it('GET /api should return 200 and API status info', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/non-existent-route should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('status', 'error');
    expect(res.body.message).toContain('Not Found');
  });
});
