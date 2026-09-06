import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  ShieldAlert, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { StatusModal, PackageOverrideModal } from './TenantActionModals';

export function TenantDirectoryPage() {
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState(null);
  const [selectedTenantForPackage, setSelectedTenantForPackage] = useState(null);

  const fetchTenants = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getTenants({
        page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        packageId: packageFilter,
      });
      setTenants(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch tenants directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(1);
  }, [statusFilter, packageFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTenants(1);
  };

  const handleStatusUpdate = async (tenantId, newStatus, reason) => {
    await adminService.updateTenantStatus(tenantId, { status: newStatus, reason });
    fetchTenants(pagination.page);
  };

  const handlePackageOverride = async (tenantId, newPackageId, reason) => {
    await adminService.overrideTenantPackage(tenantId, { packageId: newPackageId, reason });
    fetchTenants(pagination.page);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="status-pill active" data-testid="status-badge-active">
            <span className="live-dot live-dot-success pulse" /> Active
          </span>
        );
      case 'suspended':
        return (
          <span className="status-pill suspended" data-testid="status-badge-suspended">
            <span className="live-dot live-dot-error" /> Suspended
          </span>
        );
      case 'trialing':
        return (
          <span className="status-pill trialing">
            <span className="live-dot live-dot-info pulse" /> Trialing
          </span>
        );
      case 'cancelled':
        return (
          <span className="status-pill error">
            <span className="live-dot live-dot-error" /> Cancelled
          </span>
        );
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="section-tag">Workspace Directory</span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 750, marginTop: '0.2rem' }}>Tenant Workspaces</h2>
          <p style={{ fontSize: '0.85rem' }}>Search, monitor, and moderate client organizations platform-wide</p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <input
              type="search"
              placeholder="Search workspace or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="search-tenant-input"
              style={{
                paddingLeft: '2.4rem',
                width: '240px',
              }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          </form>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="status-filter-select"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trialing">Trialing</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Package filter */}
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            data-testid="package-filter-select"
          >
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button
            onClick={() => fetchTenants(pagination.page)}
            className="btn-icon"
            title="Refresh list"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'pulse-glow' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Tenants Table */}
      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Workspace Name</th>
              <th>Plan Tier</th>
              <th>Status</th>
              <th>Members</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && tenants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="pulse-glow">Loading tenant workspaces...</div>
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No tenant workspaces match the selected criteria.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.contactEmail || 'No contact email'}</div>
                  </td>
                  <td>
                    <span className="status-pill info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {t.packageName || t.packageId || 'Free'}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(t.status)}
                  </td>
                  <td className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {t.userCount}
                  </td>
                  <td className="tabular-nums" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link
                        to={`/admin/tenants/${t.id}`}
                        className="btn-icon"
                        title="View Full Tenant Details"
                        data-testid={`inspect-tenant-${t.id}`}
                      >
                        <Eye size={15} color="var(--accent-secondary)" />
                      </Link>
                      <button
                        onClick={() => setSelectedTenantForPackage(t)}
                        className="btn-icon"
                        title="Override Package Tier"
                        data-testid={`override-package-${t.id}`}
                      >
                        <Layers size={15} color="var(--accent-primary)" />
                      </button>
                      <button
                        onClick={() => setSelectedTenantForStatus(t)}
                        className="btn-icon"
                        title="Moderate Tenant Status"
                        data-testid={`moderate-status-${t.id}`}
                      >
                        <ShieldAlert size={15} color={t.status === 'active' ? 'var(--error)' : 'var(--success)'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <span className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total workspaces)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchTenants(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="btn-icon"
              data-testid="prev-page-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchTenants(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="btn-icon"
              data-testid="next-page-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Action Modals */}
      <StatusModal
        isOpen={Boolean(selectedTenantForStatus)}
        tenant={selectedTenantForStatus}
        onClose={() => setSelectedTenantForStatus(null)}
        onConfirm={handleStatusUpdate}
      />

      <PackageOverrideModal
        isOpen={Boolean(selectedTenantForPackage)}
        tenant={selectedTenantForPackage}
        onClose={() => setSelectedTenantForPackage(null)}
        onConfirm={handlePackageOverride}
      />
    </div>
  );
}
