import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { TenantSettingsPage } from './features/tenants/TenantSettingsPage';
import { HealthStatusView } from './features/system/HealthStatusView';
import { Sparkles, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-react';

function DashboardHome() {
  const { user, tenant, isAuthenticated } = useAuth();

  return (
    <main style={{ flex: 1, padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '720px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
          <Sparkles size={14} />
          <span>Multi-Tenant Business Intelligence Platform</span>
        </div>
        
        {isAuthenticated ? (
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              Welcome back, {user?.firstName || tenant?.name}!
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Operating in isolated tenant workspace: <strong>{tenant?.name}</strong> (Tier: <span style={{ textTransform: 'capitalize' }}>{tenant?.packageId || 'free'}</span>)
            </p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              Multi-Tenant Analytics Platform
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Self-service business intelligence with automated data profiling, cleansing, and insights.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                Sign In
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
          </Routes>
          <footer style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginTop: 'auto',
          }}>
            InsightForge Platform &copy; 2026. Multi-Tenant Business Intelligence SaaS.
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
