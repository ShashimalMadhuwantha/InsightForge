const express = require('express');
const {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require('./auth.controller');
const { authenticate } = require('../../common/middlewares/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

module.exports = router;
