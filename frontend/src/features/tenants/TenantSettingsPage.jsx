import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Shield, Save, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { authService } from '../auth/authService';
import { useAuth } from '../auth/AuthContext';

export function TenantSettingsPage() {
  const { updateTenantState } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authService.getTenantProfile();
      setProfile(res.data);
      setFormData({
        name: res.data.name || '',
        contactEmail: res.data.contactEmail || '',
        contactPhone: res.data.contactPhone || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const res = await authService.updateTenantProfile(formData);
      setProfile(res.data);
      updateTenantState({ name: res.data.name });
      setSuccessMsg('Workspace settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="pulse-glow" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          Loading workspace profile & quotas...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-tag">Tenant Governance</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '0.2rem', marginBottom: '0.35rem' }}>
          Workspace Settings
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Manage your organization profile, package tier limits, and tenant configurations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Active Package Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--text-inverse)' }}>
              <Layers size={18} />
            </div>
            <div>
              <span className="section-tag">Active Subscription</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 750 }}>Plan & Quotas</h3>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Tier:</span>
            <span className="status-pill info" data-testid="package-tier-badge" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
              {profile?.package?.name || 'Free Explorer'}
            </span>
          </div>

          <div className="tabular-nums" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>&bull; Max Sub-Users: <strong style={{ color: 'var(--text-primary)' }}>{profile?.package?.limits?.max_sub_users ?? 1}</strong></div>
            <div>&bull; Max Data Sources: <strong style={{ color: 'var(--text-primary)' }}>{profile?.package?.limits?.max_data_sources ?? 2}</strong></div>
            <div>&bull; Max File Size: <strong style={{ color: 'var(--text-primary)' }}>{profile?.package?.limits?.max_file_size_mb ?? 5} MB</strong></div>
          </div>
        </div>

        {/* Workspace Summary Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
              <Shield size={18} />
            </div>
            <div>
              <span className="section-tag" style={{ color: 'var(--success)' }}>Security Layer</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 750 }}>Tenant Isolation</h3>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>&bull; Tenant UUID: <code className="font-mono" style={{ color: 'var(--accent-secondary)' }}>{profile?.id?.slice(0, 8)}...</code></div>
            <div>&bull; Operating Status: <span className="status-pill active" style={{ fontSize: '0.7rem' }}><span className="live-dot live-dot-success pulse" /> {profile?.status || 'active'}</span></div>
            <div>&bull; Active Users: <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{profile?.userCount || 1}</strong></div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 750, marginBottom: '1.25rem' }}>Organization Details</h3>

        {successMsg && (
          <div data-testid="settings-success-alert" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">
              Business / Organization Name *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                data-testid="business-name-setting-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                }}
              />
              <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Contact Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@company.com"
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                  }}
                />
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Contact Phone
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                  }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              data-testid="save-settings-btn"
            >
              <Save size={16} />
              <span>{saving ? 'Saving changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
