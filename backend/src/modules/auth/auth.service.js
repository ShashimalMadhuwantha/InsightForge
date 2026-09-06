const { randomUUID } = require('crypto');
const { db } = require('../../common/config/db');
const { redis } = require('../../common/config/redis');
const { hashPassword, comparePassword } = require('../../common/utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateAndRevokeRefreshToken,
  revokeAllUserSessions,
} = require('../../common/utils/token');

class AuthService {
  /**
   * Register a new business tenant and its initial Owner account in a transaction
   */
  async signupTenant({ businessName, email, password, firstName, lastName, packageId = 'free' }) {
    if (!businessName || !businessName.trim()) {
      const error = new Error('Business name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const error = new Error('A valid email address is required');
      error.statusCode = 400;
      throw error;
    }

    if (!password || password.length < 8) {
      const error = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered as owner
    const existingUser = await db('users')
      .where({ email: normalizedEmail, role: 'owner' })
      .first();

    if (existingUser) {
      const error = new Error('An account with this email already exists as a tenant owner');
      error.statusCode = 409;
      throw error;
    }

    const tenantId = randomUUID();
    const userId = randomUUID();
    const passwordHash = await hashPassword(password);

    // Execute within database transaction
    await db.transaction(async (trx) => {
      // 1. Create tenant record
      await trx('tenants').insert({
        id: tenantId,
        name: businessName.trim(),
        package_id: packageId,
        status: 'active',
        contact_email: normalizedEmail,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // 2. Create owner user record
      await trx('users').insert({
        id: userId,
        tenant_id: tenantId,
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        role: 'owner',
        status: 'active',
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    const userPayload = {
      id: userId,
      tenant_id: tenantId,
      email: normalizedEmail,
      role: 'owner',
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);
    await storeRefreshToken(userId, refreshToken);

    return {
      user: {
        id: userId,
        email: normalizedEmail,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        role: 'owner',
      },
      tenant: {
        id: tenantId,
        name: businessName.trim(),
        packageId,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Authenticate existing tenant user
   */
  async loginUser({ email, password }) {
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fetch user and joined tenant details
    const user = await db('users')
      .join('tenants', 'users.tenant_id', 'tenants.id')
      .where('users.email', normalizedEmail)
      .where('users.status', 'active')
      .where('tenants.status', 'active')
      .select(
        'users.id',
        'users.tenant_id',
        'users.email',
        'users.password_hash',
        'users.role',
        'users.first_name',
        'users.last_name',
        'tenants.name as tenant_name',
        'tenants.package_id'
      )
      .first();

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update last login timestamp
    await db('users').where({ id: user.id }).update({ last_login_at: new Date() });

    const userPayload = {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      tenant: {
        id: user.tenant_id,
        name: user.tenant_name,
        packageId: user.package_id,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Issue new access token using valid refresh token (with rotation)
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 400;
      throw error;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const isValidSession = await validateAndRevokeRefreshToken(decoded.id, refreshToken);
    if (!isValidSession) {
      const error = new Error('Refresh token has been revoked');
      error.statusCode = 401;
      throw error;
    }

    const user = await db('users')
      .where({ id: decoded.id, status: 'active' })
      .first();

    if (!user) {
      const error = new Error('User account not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    const userPayload = {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken(userPayload);
    await storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Log out user session
   */
  async logoutUser(userId, refreshToken) {
    if (userId && refreshToken) {
      await validateAndRevokeRefreshToken(userId, refreshToken);
    } else if (userId) {
      await revokeAllUserSessions(userId);
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Initiate password reset request with token stored in Redis (1 hour TTL)
   */
  async requestPasswordReset(email) {
    if (!email) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await db('users').where({ email: email.trim().toLowerCase() }).first();
    // Return success even if user not found to prevent user enumeration
    if (!user) {
      return { success: true, message: 'If this email is registered, a password reset link has been dispatched.' };
    }

    const resetToken = randomUUID();
    if (redis) {
      await redis.set(`password_reset:${resetToken}`, user.id, 'EX', 3600);
    }

    return {
      success: true,
      message: 'If this email is registered, a password reset link has been dispatched.',
      resetToken, // Provided for automated testing / dev
    };
  }

  /**
   * Complete password reset
   */
  async resetPassword(resetToken, newPassword) {
    if (!resetToken || !newPassword || newPassword.length < 8) {
      const error = new Error('Valid token and new password (min 8 chars) are required');
      error.statusCode = 400;
      throw error;
    }

    let userId;
    if (redis) {
      userId = await redis.get(`password_reset:${resetToken}`);
    }

    if (!userId) {
      const error = new Error('Invalid or expired reset token');
      error.statusCode = 400;
      throw error;
    }

    const newHash = await hashPassword(newPassword);
    await db('users').where({ id: userId }).update({
      password_hash: newHash,
      updated_at: new Date(),
    });

    if (redis) {
      await redis.del(`password_reset:${resetToken}`);
      await revokeAllUserSessions(userId);
    }

    return { success: true, message: 'Password has been updated successfully.' };
  }

  /**
   * Get authenticated user & tenant profile
   */
  async getProfile(userId, tenantId) {
    const user = await db('users')
      .join('tenants', 'users.tenant_id', 'tenants.id')
      .where('users.id', userId)
      .where('users.tenant_id', tenantId)
      .select(
        'users.id',
        'users.tenant_id',
        'users.email',
        'users.role',
        'users.first_name',
        'users.last_name',
        'users.created_at',
        'tenants.name as tenant_name',
        'tenants.package_id',
        'tenants.logo_url'
      )
      .first();

    if (!user) {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
      },
      tenant: {
        id: user.tenant_id,
        name: user.tenant_name,
        packageId: user.package_id,
        logoUrl: user.logo_url,
      },
    };
  }
}

module.exports = new AuthService();
