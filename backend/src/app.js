const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./common/config/env');
const { notFoundHandler, errorHandler } = require('./common/middlewares/errorHandler');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API route ping
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'InsightForge Multi-Tenant BI API is operational',
    version: '1.0.0',
  });
});

module.exports = app;
