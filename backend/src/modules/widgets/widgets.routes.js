const express = require('express');
const { authenticate, requireRole } = require('../../common/middlewares/auth');
const { tenantScope } = require('../../common/middlewares/tenantScope');
const widgetsController = require('./widgets.controller');

const router = express.Router();

// All widget routes require active authentication and tenant scoping
router.use(authenticate, tenantScope);

// Suggestion Engine (Task 6.2)
router.get('/suggestions/:dataSourceId', widgetsController.getSuggestions);

// Query Execution (Task 6.3)
router.post('/query', widgetsController.executeWidgetQuery);

// Widget CRUD
router.get('/', widgetsController.listWidgets);
router.get('/:id', widgetsController.getWidgetById);

// Creation and Mutation restricted to creator, tenant_admin, super_admin
router.post('/', requireRole('tenant_admin', 'creator', 'super_admin'), widgetsController.createWidget);
router.put('/:id', requireRole('tenant_admin', 'creator', 'super_admin'), widgetsController.updateWidget);
router.delete('/:id', requireRole('tenant_admin', 'creator', 'super_admin'), widgetsController.deleteWidget);

module.exports = router;
