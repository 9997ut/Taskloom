import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, clearCollections, app } from './setup';

describe('Auth API', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should set refresh token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('refreshToken='))
        : cookies;
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(409);

      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' })
        .expect(400);

      expect(res.body.error.fields.password).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(200);

      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should return generic error for wrong email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: validUser.password })
        .expect(401);

      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      // Must NOT reveal whether email exists
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should return same generic error for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPass123' })
        .expect(401);

      // Must be identical message to wrong-email case
      expect(res.body.error.message).toBe('Invalid email or password');
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should rotate refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const cookies = registerRes.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookieStr)
        .expect(200);

      expect(refreshRes.body.accessToken).toBeDefined();

      // old token should no longer work (rotation)
      const secondRefresh = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookieStr)
        .expect(401);

      expect(secondRefresh.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should reject when no refresh token present', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(res.body.error.code).toBe('NO_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear refresh cookie and return 204', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const cookies = registerRes.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookieStr)
        .expect(204);

      // After logout, refresh should fail
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookieStr)
        .expect(401);
    });

    it('should return 204 even without a cookie', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(204);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const { accessToken } = registerRes.body;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.name).toBe(validUser.name);
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should reject with malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
