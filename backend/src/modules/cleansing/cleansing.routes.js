const express = require('express');
const { authenticate, requireRole } = require('../../common/middlewares/auth');
const cleansingController = require('./cleansing.controller');

const router = express.Router({ mergeParams: true });

// All cleansing endpoints require authentication
router.use(authenticate);

// 1. Dry-run preview of cleansing recipe (Task 5.3 & 5.5)
router.post('/:id/cleansing/preview', cleansingController.previewCleansing);

// 2. Apply cleansing recipe and generate new immutable version (Task 5.4 & 5.5)
router.post(
  '/:id/cleansing/apply',
  requireRole('owner', 'admin', 'analyst'),
  cleansingController.applyCleansing
);

// 3. List all dataset versions with transformation recipes (Task 5.5)
router.get('/:id/versions', cleansingController.listVersions);

// 4. Revert dataset to an earlier version (Task 5.5 & 5.7)
router.post(
  '/:id/versions/:versionNumber/revert',
  requireRole('owner', 'admin'),
  cleansingController.revertVersion
);

module.exports = router;
