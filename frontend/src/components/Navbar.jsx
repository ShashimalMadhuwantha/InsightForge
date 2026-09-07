import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Sun, Moon, LogOut, Settings, Building2, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../hooks/useTheme';

export function Navbar() {
  const { user, tenant, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 2rem',
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-inverse)',
            boxShadow: 'var(--accent-glow-subtle)',
          }}>
            <BarChart3 size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em', background: 'var(--accent-gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              InsightForge
            </span>
            <span className="status-pill success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              SaaS BI
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Switcher Button */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            data-testid="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={17} color="var(--warning)" /> : <Moon size={17} color="var(--accent-primary)" />}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isSuperAdmin && (
                <Link
                  to="/admin"
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  data-testid="super-admin-nav-link"
                >
                  <Shield size={14} />
                  <span>Admin Portal</span>
                </Link>
              )}

              {isSuperAdmin ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.8rem',
                  background: 'var(--accent-glow)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 700,
                }}>
                  <Shield size={14} />
                  <span>Platform Super Admin</span>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.8rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <Building2 size={14} color="var(--accent-secondary)" />
                  <span style={{ fontWeight: 650 }}>{tenant?.name || 'Workspace'}</span>
                </div>
              )}

              {/* Plans Link */}
              <Link to="/packages" className="btn btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }} data-testid="packages-nav-link">
                <Sparkles size={14} color="var(--accent-primary)" />
                <span>Plans</span>
              </Link>

              {/* User Settings Link */}
              <Link to="/settings" className="btn btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }} data-testid="settings-nav-link">
                <Settings size={14} />
                <span>Settings</span>
              </Link>

              {/* Logout Button */}
              <button onClick={handleLogout} className="btn-icon" title="Log out" data-testid="logout-btn">
                <LogOut size={16} color="var(--error)" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/pricing" className="btn btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }} data-testid="pricing-nav-link">
                Pricing
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.45rem 1.15rem', fontSize: '0.85rem' }}>
                Create Workspace
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
