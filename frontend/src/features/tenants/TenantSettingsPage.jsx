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
        Loading workspace profile...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Workspace Settings</h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Manage your organization profile, package tier limits, and tenant configurations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Active Package Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Subscription Plan</h3>
              <p style={{ fontSize: '0.8rem' }}>Tier & feature allowances</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active Tier:</span>
            <span className="badge badge-success" data-testid="package-tier-badge">
              {profile?.package?.name || 'Free Explorer'}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>&bull; Max Sub-Users: <strong>{profile?.package?.limits?.max_sub_users ?? 1}</strong></div>
            <div>&bull; Max Data Sources: <strong>{profile?.package?.limits?.max_data_sources ?? 2}</strong></div>
            <div>&bull; Max File Size: <strong>{profile?.package?.limits?.max_file_size_mb ?? 5} MB</strong></div>
          </div>
        </div>

        {/* Workspace Summary Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Tenant Isolation</h3>
              <p style={{ fontSize: '0.8rem' }}>Scoped security & metadata</p>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>&bull; Tenant UUID: <code style={{ color: 'var(--accent-secondary)' }}>{profile?.id?.slice(0, 8)}...</code></div>
            <div>&bull; Workspace Status: <span className="badge badge-success">{profile?.status || 'active'}</span></div>
            <div>&bull; Active Users: <strong>{profile?.userCount || 1}</strong></div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Organization Details</h3>

        {successMsg && (
          <div data-testid="settings-success-alert" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Business Name *
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
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Contact Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@company.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
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
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            data-testid="save-settings-btn"
          >
            <Save size={16} />
            <span>{saving ? 'Saving changes...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
