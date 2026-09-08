const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dataSourcesController = require('./data-sources.controller');
const { authenticate, requireRole } = require('../../common/middlewares/auth');

// Multer Storage Configuration (Temporary upload directory)
const tmpUploadDir = path.join(process.cwd(), 'uploads', 'tmp');
if (!fs.existsSync(tmpUploadDir)) {
  fs.mkdirSync(tmpUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB upper safety ceiling (individual plan limits enforced in service)
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file format. Only .xlsx, .xls, and .csv files are supported.');
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

// All routes require tenant authentication
router.use(authenticate);

// 1. Upload & ingest dataset (Task 4.2)
router.post(
  '/upload',
  requireRole('owner', 'admin', 'analyst'),
  upload.single('file'),
  dataSourcesController.uploadDataSource
);

// 2. List tenant data sources (Task 4.8)
router.get('/', dataSourcesController.listDataSources);

// 3. Get single data source specification & schema (Task 4.5)
router.get('/:id', dataSourcesController.getDataSourceById);

// 4. Get parsing / quality status telemetry (Task 4.5 & Task 4.6 polling)
router.get('/:id/status', dataSourcesController.getDataSourceStatus);

// 5. Get sample rows preview (Task 4.7 preview)
router.get('/:id/preview', dataSourcesController.getDataSourcePreview);

// 6. Refresh / Re-upload dataset creating a new version (Task 4.9)
router.post(
  '/:id/refresh',
  requireRole('owner', 'admin', 'analyst'),
  upload.single('file'),
  dataSourcesController.refreshDataSource
);

// 7. Delete data source (Owner/Admin only)
router.delete(
  '/:id',
  requireRole('owner', 'admin'),
  dataSourcesController.deleteDataSource
);

// 8. Data Cleansing & Version History Sub-routes (Epic 5)
const cleansingRoutes = require('../cleansing/cleansing.routes');
router.use('/', cleansingRoutes);

module.exports = router;

