const request = require('supertest');
const app = require('../../../app');
const authService = require('../auth.service');
const { generateAccessToken } = require('../../../common/utils/token');

describe('Auth Module Integration & API Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ businessName: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('successfully registers tenant and owner account', async () => {
      jest.spyOn(authService, 'signupTenant').mockResolvedValueOnce({
        user: { id: 'u1', email: 'owner@acme.com', role: 'owner' },
        tenant: { id: 't1', name: 'Acme Corp', packageId: 'free' },
        tokens: { accessToken: 'mock_access_jwt', refreshToken: 'mock_refresh_jwt' },
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          businessName: 'Acme Corp',
          email: 'owner@acme.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tenant.name).toBe('Acme Corp');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates user with valid credentials', async () => {
      jest.spyOn(authService, 'loginUser').mockResolvedValueOnce({
        user: { id: 'u1', email: 'owner@acme.com', role: 'owner' },
        tenant: { id: 't1', name: 'Acme Corp', packageId: 'free' },
        tokens: { accessToken: 'mock_access_jwt', refreshToken: 'mock_refresh_jwt' },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'owner@acme.com', password: 'Password123!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('owner@acme.com');
    });

    it('rejects invalid credentials with 401', async () => {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      jest.spyOn(authService, 'loginUser').mockRejectedValueOnce(err);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@acme.com', password: 'badpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('issues new tokens when valid refresh token is supplied', async () => {
      jest.spyOn(authService, 'refreshAccessToken').mockResolvedValueOnce({
        accessToken: 'new_access_jwt',
        refreshToken: 'new_refresh_jwt',
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBe('new_access_jwt');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes session on logout', async () => {
      jest.spyOn(authService, 'logoutUser').mockResolvedValueOnce({
        success: true,
        message: 'Logged out successfully',
      });

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'token_to_revoke' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns profile when authenticated with Bearer token', async () => {
      const token = generateAccessToken({
        id: 'u1',
        tenant_id: 't1',
        email: 'owner@acme.com',
        role: 'owner',
      });

      jest.spyOn(authService, 'getProfile').mockResolvedValueOnce({
        user: { id: 'u1', email: 'owner@acme.com', role: 'owner' },
        tenant: { id: 't1', name: 'Acme Corp', packageId: 'free' },
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe('owner@acme.com');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });
});
