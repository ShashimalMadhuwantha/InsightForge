import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Sun, Moon, LogOut, Settings, Building2, User } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../hooks/useTheme';

export function Navbar() {
  const { tenant, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 2rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              InsightForge
            </span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.3)', textTransform: 'uppercase', fontWeight: 700 }}>
              SaaS BI
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Theme Switcher Button */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            data-testid="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Tenant Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}>
                <Building2 size={14} color="var(--accent-secondary)" />
                <span style={{ fontWeight: 600 }}>{tenant?.name || 'Workspace'}</span>
              </div>

              {/* User / Settings Link */}
              <Link to="/settings" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} data-testid="settings-nav-link">
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
