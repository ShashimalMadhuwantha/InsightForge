import { apiClient } from './apiClient';

export const adminService = {
  async getTenants(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.packageId) query.append('packageId', params.packageId);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/api/admin/tenants${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(endpoint);
  },

  async getTenantDetails(tenantId) {
    return apiClient.get(`/api/admin/tenants/${tenantId}`);
  },

  async updateTenantStatus(tenantId, { status, reason }) {
    return apiClient.patch(`/api/admin/tenants/${tenantId}/status`, { status, reason });
  },

  async overrideTenantPackage(tenantId, { packageId, reason }) {
    return apiClient.patch(`/api/admin/tenants/${tenantId}/package`, { packageId, reason });
  },

  async getGlobalAnalytics() {
    return apiClient.get('/api/admin/analytics/overview');
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.targetTenantId) query.append('targetTenantId', params.targetTenantId);
    if (params.action) query.append('action', params.action);

    const queryString = query.toString();
    const endpoint = `/api/admin/audit-logs${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(endpoint);
  },
};
