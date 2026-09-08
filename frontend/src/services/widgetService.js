import { apiClient } from './apiClient';

export const widgetService = {
  /**
   * List tenant widgets with optional search, pagination, and filters
   */
  async getWidgets(params = {}) {
    const res = await apiClient.get('/api/widgets', { params });
    return res.data;
  },

  /**
   * Get widget details by ID
   */
  async getWidgetById(id) {
    const res = await apiClient.get(`/api/widgets/${id}`);
    return res.data;
  },

  /**
   * Create a new widget
   */
  async createWidget(payload) {
    const res = await apiClient.post('/api/widgets', payload);
    return res.data;
  },

  /**
   * Update an existing widget
   */
  async updateWidget(id, payload) {
    const res = await apiClient.put(`/api/widgets/${id}`, payload);
    return res.data;
  },

  /**
   * Delete a widget
   */
  async deleteWidget(id) {
    const res = await apiClient.delete(`/api/widgets/${id}`);
    return res.data;
  },

  /**
   * Execute ad-hoc or saved widget query on dataset version
   */
  async queryWidgetData(payload) {
    const res = await apiClient.post('/api/widgets/query', payload);
    return res.data;
  },

  /**
   * Get smart chart recommendations for a dataset
   */
  async getSuggestions(dataSourceId) {
    const res = await apiClient.get(`/api/widgets/suggestions/${dataSourceId}`);
    return res.data;
  },
};
