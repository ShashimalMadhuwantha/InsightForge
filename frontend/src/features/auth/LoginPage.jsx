import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3.5rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: 'var(--accent-glow)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <ShieldCheck size={14} />
            <span>SECURE SSO & TENANT AUTH</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sign in to your InsightForge tenant workspace</p>
        </div>

        {error && (
          <div
            data-testid="login-error-alert"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@company.com"
                required
                data-testid="login-email-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                required
                data-testid="login-password-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={loading}
            data-testid="login-submit-btn"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have a workspace yet?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 650, textDecoration: 'none' }}>
            Create one in 30s
          </Link>
        </div>
      </div>
    </div>
  );
}
