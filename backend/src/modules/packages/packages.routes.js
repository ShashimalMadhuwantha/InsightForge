const express = require('express');
const router = express.Router();
const packagesController = require('./packages.controller');
const { authenticate, requireRole } = require('../../common/middlewares/auth');

// Public: List all available subscription tiers
router.get('/', packagesController.getAllPackages);

// Public/Tenant: Get single package specification
router.get('/:id', packagesController.getPackageById);

// Tenant Authenticated: Get active plan, limits, and live quota utilization
router.get('/tenant/my-plan', authenticate, packagesController.getMyPlan);

// Tenant Authenticated (Owner/Admin): Self-service upgrade or downgrade
router.post(
  '/tenant/upgrade',
  authenticate,
  requireRole('owner', 'admin', 'super_admin'),
  packagesController.changePlan
);

// Tenant Authenticated: Initialize simulated Stripe checkout session
router.post(
  '/tenant/checkout-session',
  authenticate,
  requireRole('owner', 'admin', 'super_admin'),
  packagesController.createCheckoutSession
);

// Webhook Receiver (Stripe/Payment gateway simulation)
router.post('/webhook', packagesController.handleWebhook);

module.exports = router;
