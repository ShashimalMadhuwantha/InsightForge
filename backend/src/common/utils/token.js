const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { redis } = require('../config/redis');

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenant_id,
      tokenType: 'refresh',
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    return null;
  }
}

// Store refresh token in Redis with 7-day TTL (key: `refresh_token:<userId>:<token>`)
async function storeRefreshToken(userId, token, expiresInSec = 7 * 24 * 3600) {
  if (!redis) return;
  const key = `refresh_token:${userId}:${token}`;
  await redis.set(key, 'valid', 'EX', expiresInSec);
}

// Validate and invalidate previous refresh token (token rotation)
async function validateAndRevokeRefreshToken(userId, token) {
  if (!redis) return true;
  const key = `refresh_token:${userId}:${token}`;
  const exists = await redis.get(key);
  if (!exists) {
    return false;
  }
  await redis.del(key);
  return true;
}

// Invalidate all tokens for user on security reset or logout
async function revokeAllUserSessions(userId) {
  if (!redis) return;
  const pattern = `refresh_token:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateAndRevokeRefreshToken,
  revokeAllUserSessions,
};
