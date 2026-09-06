import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function StatusModal({ isOpen, onClose, tenant, onConfirm }) {
  const [status, setStatus] = useState(tenant?.status === 'active' ? 'suspended' : 'active');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for this audit event.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onConfirm(tenant.id, status, reason);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update tenant status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            background: status === 'suspended' ? 'var(--error-bg)' : 'var(--success-bg)',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            color: status === 'suspended' ? 'var(--error)' : 'var(--success)',
          }}>
            {status === 'suspended' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Update Tenant Status</h3>
            <p style={{ fontSize: '0.85rem' }}>{tenant.name}</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Select Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              data-testid="status-select"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="active">Active (Operational)</option>
              <option value="suspended">Suspended (Access Revoked)</option>
              <option value="trialing">Trialing</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Reason / Audit Notes *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder="e.g. Terms violation, non-payment, manual reactivation..."
              required
              data-testid="status-reason-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              data-testid="confirm-status-btn"
              style={{ background: status === 'suspended' ? 'var(--error)' : 'var(--accent-gradient)' }}
            >
              {loading ? 'Saving...' : 'Apply Status Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PackageOverrideModal({ isOpen, onClose, tenant, onConfirm }) {
  const [packageId, setPackageId] = useState(tenant?.packageId || 'starter');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for overriding this subscription.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onConfirm(tenant.id, packageId, reason);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to override plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            background: 'var(--info-bg)',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--info)',
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Override Subscription Tier</h3>
            <p style={{ fontSize: '0.85rem' }}>{tenant.name}</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Target Subscription Package
            </label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              data-testid="package-select"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="free">Free Explorer (0$/mo)</option>
              <option value="starter">Starter Team (29$/mo)</option>
              <option value="growth">Growth Business (79$/mo)</option>
              <option value="enterprise">Enterprise Pro (199$/mo)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Administrative Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder="e.g. VIP partner license, complimentary trial extension, contract upgrade..."
              required
              data-testid="package-reason-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              data-testid="confirm-package-btn"
            >
              {loading ? 'Saving...' : 'Apply Plan Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
