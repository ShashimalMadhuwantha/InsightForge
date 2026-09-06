import { apiClient } from '../../services/apiClient';

class AuthService {
  async signup(data) {
    return apiClient.post('/api/auth/signup', data);
  }

  async login(credentials) {
    return apiClient.post('/api/auth/login', credentials);
  }

  async refresh(refreshToken) {
    return apiClient.post('/api/auth/refresh', { refreshToken });
  }

  async logout(refreshToken) {
    const token = localStorage.getItem('insightforge_access_token');
    return apiClient.post(
      '/api/auth/logout',
      { refreshToken },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
  }

  async forgotPassword(email) {
    return apiClient.post('/api/auth/forgot-password', { email });
  }

  async resetPassword(token, newPassword) {
    return apiClient.post('/api/auth/reset-password', { token, newPassword });
  }

  async getMe() {
    const token = localStorage.getItem('insightforge_access_token');
    if (!token) throw new Error('No active token');
    return apiClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getTenantProfile() {
    const token = localStorage.getItem('insightforge_access_token');
    return apiClient.get('/api/tenants/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateTenantProfile(data) {
    const token = localStorage.getItem('insightforge_access_token');
    return apiClient.request('/api/tenants/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }
}

export const authService = new AuthService();
