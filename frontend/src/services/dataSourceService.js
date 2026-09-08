import { apiClient } from './apiClient';

export const dataSourceService = {
  /**
   * Upload and ingest new dataset (multipart/form-data)
   */
  async uploadDataSource(file, name = '', _onUploadProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }

    const res = await apiClient.post('/api/data-sources/upload', formData);
    return res;
  },

  /**
   * List data sources for current tenant
   */
  async listDataSources(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/api/data-sources${query ? `?${query}` : ''}`;
    const res = await apiClient.get(url);
    return res;
  },

  /**
   * Get single data source details and schema profile
   */
  async getDataSourceById(id) {
    const res = await apiClient.get(`/api/data-sources/${id}`);
    return res.data;
  },

  /**
   * Poll live data source status and parsing telemetry
   */
  async getDataSourceStatus(id) {
    const res = await apiClient.get(`/api/data-sources/${id}/status`);
    return res.data;
  },

  /**
   * Get sample preview rows
   */
  async getDataSourcePreview(id, limit = 50) {
    const res = await apiClient.get(`/api/data-sources/${id}/preview?limit=${limit}`);
    return res.data;
  },

  /**
   * Re-upload / refresh dataset creating a new version
   */
  async refreshDataSource(id, file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post(`/api/data-sources/${id}/refresh`, formData);
    return res;
  },

  /**
   * Delete data source
   */
  async deleteDataSource(id) {
    const res = await apiClient.delete(`/api/data-sources/${id}`);
    return res;
  },
};
