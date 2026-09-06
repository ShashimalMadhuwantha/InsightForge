import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';

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
    <div className="modal-backdrop">
      <div className="modal-box" style={{ padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          className="btn-icon"
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            width: '32px',
            height: '32px',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: status === 'suspended' ? 'var(--error-bg)' : 'var(--success-bg)',
            border: `1px solid ${status === 'suspended' ? 'var(--error-border)' : 'var(--success-border)'}`,
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            color: status === 'suspended' ? 'var(--error)' : 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {status === 'suspended' ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <div>
            <span className="section-tag" style={{ color: status === 'suspended' ? 'var(--error)' : 'var(--success)' }}>
              Moderation Governance
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 750 }}>Update Tenant Status</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tenant.name}</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            border: '1px solid var(--error-border)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">
              Target Operating Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              data-testid="status-select"
            >
              <option value="active">Active (Full Access Granted)</option>
              <option value="suspended">Suspended (Immediate Session Revocation)</option>
              <option value="trialing">Trialing (Evaluation Period)</option>
              <option value="cancelled">Cancelled (Decommissioned)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Audit Reason & Justification *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder="e.g. Terms of service violation, billing non-compliance, manual reactivation..."
              required
              data-testid="status-reason-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className={status === 'suspended' ? 'btn btn-danger' : 'btn btn-primary'}
              disabled={loading}
              data-testid="confirm-status-btn"
            >
              {loading ? 'Processing...' : status === 'suspended' ? 'Suspend Workspace' : 'Activate Workspace'}
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
    <div className="modal-backdrop">
      <div className="modal-box" style={{ padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          className="btn-icon"
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            width: '32px',
            height: '32px',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--accent-glow)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Layers size={22} />
          </div>
          <div>
            <span className="section-tag">Tier Overrides</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 750 }}>Assign Subscription Package</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tenant.name}</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            border: '1px solid var(--error-border)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">
              Target Subscription Tier
            </label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              data-testid="package-select"
            >
              <option value="free">Free Explorer (0$/mo)</option>
              <option value="starter">Starter Team (29$/mo)</option>
              <option value="growth">Growth Business (79$/mo)</option>
              <option value="enterprise">Enterprise Pro (199$/mo)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Administrative Justification *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder="e.g. Strategic partner trial extension, contracted plan upgrade, VIP license..."
              required
              data-testid="package-reason-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
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
