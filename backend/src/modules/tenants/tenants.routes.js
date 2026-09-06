const express = require('express');
const { getProfile, updateProfile } = require('./tenants.controller');
const { authenticate, requireRole } = require('../../common/middlewares/auth');
const { tenantScope } = require('../../common/middlewares/tenantScope');

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

router.get('/profile', getProfile);
router.put('/profile', requireRole('owner', 'admin'), updateProfile);

module.exports = router;
