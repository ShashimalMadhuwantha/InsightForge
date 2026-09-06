import React, { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { adminService } from '../../services/adminService';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAuditLogs({
        page,
        limit: pagination.limit,
        action: actionFilter,
      });
      setLogs(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch platform audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Platform Audit Trail</h2>
          <p style={{ fontSize: '0.85rem' }}>Immutable record of all super-admin interventions and moderation events</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            data-testid="audit-action-filter"
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Actions</option>
            <option value="TENANT_STATUS_UPDATE">TENANT_STATUS_UPDATE</option>
            <option value="TENANT_PACKAGE_OVERRIDE">TENANT_PACKAGE_OVERRIDE</option>
          </select>

          <button
            onClick={() => fetchLogs(pagination.page)}
            className="btn-icon"
            title="Refresh logs"
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

      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Target Workspace</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Admin User</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Event Details / Reason</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>IP Address</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.targetTenantName || log.targetTenantId || 'Global Platform'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    {log.adminUserEmail || log.adminUserId}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontSize: '0.8rem', maxWidth: '300px' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                    </pre>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {log.ipAddress || 'Internal'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total audit records)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="btn-icon"
              data-testid="prev-audit-page-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="btn-icon"
              data-testid="next-audit-page-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
