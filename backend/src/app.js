const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./common/config/env');
const healthRoutes = require('./modules/system/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const tenantsRoutes = require('./modules/tenants/tenants.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const packagesRoutes = require('./modules/packages/packages.routes');
const dataSourcesRoutes = require('./modules/data-sources/data-sources.routes');
const widgetsRoutes = require('./modules/widgets/widgets.routes');
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

// Health check routes
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// Auth, Tenant, Packages, Data Sources, Widgets & Admin routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/data-sources', dataSourcesRoutes);
app.use('/api/widgets', widgetsRoutes);
app.use('/api/admin', adminRoutes);

// Base API route ping
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'InsightForge Multi-Tenant BI API is operational',
    version: '1.0.0',
  });
});

// Central 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
