import { apiClient } from './apiClient';

export const cleansingService = {
  /**
   * Dry-run preview of cleansing transformations on sample rows
   */
  async previewCleansing(dataSourceId, recipe = []) {
    const res = await apiClient.post(`/api/data-sources/${dataSourceId}/cleansing/preview`, { recipe });
    return res.data;
  },

  /**
   * Apply cleansing recipe and generate new immutable version
   */
  async applyCleansing(dataSourceId, recipe = []) {
    const res = await apiClient.post(`/api/data-sources/${dataSourceId}/cleansing/apply`, { recipe });
    return res.data;
  },

  /**
   * List all versions for a data source with transformation recipes
   */
  async listVersions(dataSourceId) {
    const res = await apiClient.get(`/api/data-sources/${dataSourceId}/versions`);
    return res.data;
  },

  /**
   * Revert dataset to an earlier version
   */
  async revertVersion(dataSourceId, versionNumber) {
    const res = await apiClient.post(`/api/data-sources/${dataSourceId}/versions/${versionNumber}/revert`);
    return res.data;
  },
};
