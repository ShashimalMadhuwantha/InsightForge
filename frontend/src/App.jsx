import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { TenantSettingsPage } from './features/tenants/TenantSettingsPage';
import { PackageSelectionPage } from './features/packages/PackageSelectionPage';
import { DataSourcesListPage } from './features/data-sources/DataSourcesListPage';
import { DataSourceUploadPage } from './features/data-sources/DataSourceUploadPage';
import { DataStatusView } from './features/data-sources/DataStatusView';
import { CleansingStudioPage } from './features/cleansing/CleansingStudioPage';
import { WidgetsListPage } from './features/widgets/WidgetsListPage';
import { ChartBuilderPage } from './features/widgets/ChartBuilderPage';
import { SuperAdminLayout } from './features/admin/SuperAdminLayout';
import { TenantDetailsPage } from './features/admin/TenantDetailsPage';
import { AdminRoute } from './components/AdminRoute';
import { HealthStatusView } from './features/system/HealthStatusView';
import { Sparkles, ArrowRight, ShieldCheck, Database, Layers, BarChart3, Zap } from 'lucide-react';

import { ThemeProvider } from './context/ThemeContext';

function DashboardHome() {
  const { user, tenant, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'super_admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <main style={{ flex: 1, padding: '3.5rem 1rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '760px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.95rem', background: 'var(--accent-glow)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '1.25rem' }}>
          <Sparkles size={14} />
          <span>MULTI-TENANT SAAS BUSINESS INTELLIGENCE</span>
        </div>
        
        {isAuthenticated ? (
          <div>
            <h1 style={{ fontSize: '2.75rem', fontWeight: 850, letterSpacing: '-0.035em', marginBottom: '0.65rem' }}>
              Welcome back, <span className="text-gradient">{user?.firstName || tenant?.name}</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Operating in isolated tenant workspace: <strong style={{ color: 'var(--text-primary)' }}>{tenant?.name}</strong> (Tier: <span className="status-pill info" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{tenant?.packageId || 'free'}</span>)
            </p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 850, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '0.85rem' }}>
              Turn Raw Data into <span className="text-gradient">Automated Insights</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto' }}>
              Enterprise multi-tenant analytics platform with automated schema detection, package-gated cleansing, and instant visual reporting.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
                Create Workspace <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
                Sign In to Tenant
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Core Infrastructure Health Check Component */}
      <HealthStatusView />
    </main>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <TenantSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-sources"
                element={
                  <ProtectedRoute>
                    <DataSourcesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-sources/upload"
                element={
                  <ProtectedRoute>
                    <DataSourceUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-sources/:id/status"
                element={
                  <ProtectedRoute>
                    <DataStatusView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-sources/:id/cleanse"
                element={
                  <ProtectedRoute>
                    <CleansingStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/widgets"
                element={
                  <ProtectedRoute>
                    <WidgetsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/widgets/new"
                element={
                  <ProtectedRoute>
                    <ChartBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/widgets/:id/edit"
                element={
                  <ProtectedRoute>
                    <ChartBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/packages" element={<PackageSelectionPage />} />
              <Route path="/pricing" element={<PackageSelectionPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <SuperAdminLayout />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/tenants/:id"
                element={
                  <AdminRoute>
                    <TenantDetailsPage />
                  </AdminRoute>
                }
              />
            </Routes>
            <footer style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '1.75rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: 'auto',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(12px)',
            }}>
              InsightForge Platform &copy; 2026. Multi-Tenant Enterprise BI SaaS Platform.
            </footer>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
