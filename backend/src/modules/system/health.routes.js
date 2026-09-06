const express = require('express');
const { getHealth, getPing } = require('./health.controller');

const router = express.Router();

router.get('/health', getHealth);
router.get('/ping', getPing);

module.exports = router;
