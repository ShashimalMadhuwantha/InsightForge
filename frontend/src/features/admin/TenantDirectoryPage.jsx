import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Filter, 
  Eye, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  AlertOctagon, 
  ChevronLeft, 
  ChevronRight,
  Shield,
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
        return <span className="badge badge-success" data-testid="status-badge-active"><CheckCircle2 size={12} /> Active</span>;
      case 'suspended':
        return <span className="badge badge-error" data-testid="status-badge-suspended"><AlertOctagon size={12} /> Suspended</span>;
      case 'trialing':
        return <span className="badge badge-warning">Trialing</span>;
      case 'cancelled':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Tenant Workspaces Directory</h2>
          <p style={{ fontSize: '0.85rem' }}>Search, monitor, and manage client tenants across the entire platform</p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="search-tenant-input"
              style={{
                padding: '0.55rem 1rem 0.55rem 2.25rem',
                fontSize: '0.85rem',
                width: '240px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </form>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="status-filter-select"
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
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
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
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
        <div style={{ padding: '0.75rem 1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Tenants Table */}
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Workspace Name</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Plan Tier</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Users</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Created Date</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && tenants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading tenant workspaces...
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
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.contactEmail || 'No contact email'}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {t.packageName || t.packageId || 'Free'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {getStatusBadge(t.status)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {t.userCount}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
