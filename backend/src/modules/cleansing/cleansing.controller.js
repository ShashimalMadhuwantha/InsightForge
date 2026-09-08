const cleansingService = require('./cleansing.service');

/**
 * Preview cleansing transformations (dry-run on sample)
 * POST /api/data-sources/:id/cleansing/preview
 */
const previewCleansing = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id;
    const { id } = req.params;
    const { recipe = [] } = req.body;

    const preview = await cleansingService.previewCleansing(tenantId, id, recipe);
    return res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Apply cleansing recipe and generate new immutable version
 * POST /api/data-sources/:id/cleansing/apply
 */
const applyCleansing = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id;
    const { id } = req.params;
    const { recipe = [] } = req.body;

    const result = await cleansingService.applyCleansing(tenantId, id, recipe, req.user);
    return res.status(201).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all versions with transformation recipes
 * GET /api/data-sources/:id/versions
 */
const listVersions = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id;
    const { id } = req.params;

    const versions = await cleansingService.listVersions(tenantId, id);
    return res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Revert dataset to an earlier version
 * POST /api/data-sources/:id/versions/:versionNumber/revert
 */
const revertVersion = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id;
    const { id, versionNumber } = req.params;

    const result = await cleansingService.revertVersion(tenantId, id, versionNumber);
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  previewCleansing,
  applyCleansing,
  listVersions,
  revertVersion,
};
