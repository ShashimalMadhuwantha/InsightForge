import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  Layers, 
  ShieldAlert, 
  FileText
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { StatusModal, PackageOverrideModal } from './TenantActionModals';

export function TenantDetailsPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isPackageModalOpen, setPackageModalOpen] = useState(false);

  const fetchTenant = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getTenantDetails(id);
      setTenant(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load tenant details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const handleStatusUpdate = async (tenantId, newStatus, reason) => {
    await adminService.updateTenantStatus(tenantId, { status: newStatus, reason });
    fetchTenant();
  };

  const handlePackageOverride = async (tenantId, newPackageId, reason) => {
    await adminService.overrideTenantPackage(tenantId, { packageId: newPackageId, reason });
    fetchTenant();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="pulse-glow" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          Loading tenant details and telemetry...
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem' }}>
        <div style={{ padding: '1.5rem', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error || 'Tenant not found.'}
        </div>
        <Link to="/admin" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 650 }}>
            <ArrowLeft size={14} /> Back to Workspaces Directory
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{tenant.name}</h1>
            <span className={`status-pill ${tenant.status === 'active' ? 'active' : 'suspended'}`}>
              <span className={`live-dot ${tenant.status === 'active' ? 'live-dot-success pulse' : 'live-dot-error'}`} />
              {tenant.status}
            </span>
          </div>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            UUID: {tenant.id}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setPackageModalOpen(true)}
            className="btn btn-outline"
            data-testid="override-package-btn"
          >
            <Layers size={16} color="var(--accent-primary)" />
            <span>Override Plan</span>
          </button>

          <button
            onClick={() => setStatusModalOpen(true)}
            className="btn btn-outline"
            data-testid="moderate-status-btn"
            style={{ color: tenant.status === 'active' ? 'var(--error)' : 'var(--success)', borderColor: tenant.status === 'active' ? 'var(--error-border)' : 'var(--success-border)' }}
          >
            <ShieldAlert size={16} />
            <span>{tenant.status === 'active' ? 'Suspend Tenant' : 'Reactivate Tenant'}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--text-inverse)' }}>
              <Building2 size={18} />
            </div>
            <div>
              <span className="section-tag">Organization</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 750 }}>Profile & Contact</h3>
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', lineHeight: 1.9, color: 'var(--text-secondary)' }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>Contact Email:</strong> <span className="font-mono">{tenant.contactEmail || 'Not configured'}</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Contact Phone:</strong> {tenant.contactPhone || 'Not configured'}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Registered:</strong> <span className="tabular-nums">{new Date(tenant.createdAt).toLocaleString()}</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Last Updated:</strong> <span className="tabular-nums">{new Date(tenant.updatedAt).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Subscription Limits Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--text-inverse)' }}>
              <Layers size={18} />
            </div>
            <div>
              <span className="section-tag">Entitlements</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 750 }}>Plan & Quotas</h3>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Tier:</span>
            <span className="status-pill info" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
              {tenant.packageName || tenant.packageId || 'Free'}
            </span>
          </div>

          <div className="tabular-nums" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>&bull; Max Sub-Users: <strong style={{ color: 'var(--text-primary)' }}>{tenant.packageLimits?.max_sub_users ?? 'N/A'}</strong></div>
            <div>&bull; Max Data Sources: <strong style={{ color: 'var(--text-primary)' }}>{tenant.packageLimits?.max_data_sources ?? 'N/A'}</strong></div>
            <div>&bull; Max File Upload Size: <strong style={{ color: 'var(--text-primary)' }}>{tenant.packageLimits?.max_file_size_mb ?? 'N/A'} MB</strong></div>
          </div>
        </div>
      </div>

      {/* Tenant Users Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.12)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-secondary)' }}>
              <Users size={18} />
            </div>
            <div>
              <span className="section-tag" style={{ color: 'var(--accent-secondary)' }}>Roster</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 750 }}>Affiliated Members ({tenant.users?.length || 0})</h3>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {tenant.users?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users registered in this tenant workspace.
                  </td>
                </tr>
              ) : (
                tenant.users?.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}` : 'Tenant User'}
                    </td>
                    <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td>
                      <span className="status-pill info" style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${u.status === 'active' ? 'active' : 'suspended'}`}>
                        <span className={`live-dot ${u.status === 'active' ? 'live-dot-success pulse' : 'live-dot-error'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Audit Log Activity */}
      {tenant.auditLogs && tenant.auditLogs.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--warning-bg)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
              <FileText size={18} />
            </div>
            <div>
              <span className="section-tag" style={{ color: 'var(--warning)' }}>Audit History</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 750 }}>Recent Administrative Interventions</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tenant.auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {log.action}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </div>
                </div>
                <div className="tabular-nums" style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modals */}
      <StatusModal
        isOpen={isStatusModalOpen}
        tenant={tenant}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleStatusUpdate}
      />

      <PackageOverrideModal
        isOpen={isPackageModalOpen}
        tenant={tenant}
        onClose={() => setPackageModalOpen(false)}
        onConfirm={handlePackageOverride}
      />
    </div>
  );
}
