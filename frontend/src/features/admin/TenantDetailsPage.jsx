import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldAlert, 
  FileText, 
  Clock,
  UserCheck,
  Shield
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
        Loading tenant details and telemetry...
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem' }}>
        <div style={{ padding: '1.5rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
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
          <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Back to Workspaces Directory
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{tenant.name}</h1>
            <span className={`badge ${tenant.status === 'active' ? 'badge-success' : 'badge-error'}`}>
              {tenant.status}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tenant UUID: <code>{tenant.id}</code>
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
            style={{ color: tenant.status === 'active' ? 'var(--error)' : 'var(--success)' }}
          >
            <ShieldAlert size={16} />
            <span>{tenant.status === 'active' ? 'Suspend Tenant' : 'Reactivate Tenant'}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Building2 size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>Organization Profile</h3>
          </div>

          <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <div><strong>Contact Email:</strong> {tenant.contactEmail || 'Not configured'}</div>
            <div><strong>Contact Phone:</strong> {tenant.contactPhone || 'Not configured'}</div>
            <div><strong>Registered On:</strong> {new Date(tenant.createdAt).toLocaleString()}</div>
            <div><strong>Last Updated:</strong> {new Date(tenant.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Subscription Limits Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Layers size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>Subscription & Limits</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tier Name:</span>
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              {tenant.packageName || tenant.packageId || 'Free'}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>&bull; Max Sub-Users: <strong>{tenant.packageLimits?.max_sub_users ?? 'N/A'}</strong></div>
            <div>&bull; Max Data Sources: <strong>{tenant.packageLimits?.max_data_sources ?? 'N/A'}</strong></div>
            <div>&bull; Max File Size: <strong>{tenant.packageLimits?.max_file_size_mb ?? 'N/A'} MB</strong></div>
          </div>
        </div>
      </div>

      {/* Tenant Users Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-secondary)' }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Registered Users ({tenant.users?.length || 0})</h3>
              <p style={{ fontSize: '0.8rem' }}>Members affiliated with this workspace</p>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>User Name</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {tenant.users?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users registered in this tenant workspace.
                  </td>
                </tr>
              ) : (
                tenant.users?.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}` : 'Tenant User'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--warning-bg)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Recent Administrative Interventions</h3>
              <p style={{ fontSize: '0.8rem' }}>Audit trail for status changes and plan adjustments</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tenant.auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '0.85rem 1rem',
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
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
