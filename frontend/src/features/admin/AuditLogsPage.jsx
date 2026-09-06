import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <span className="section-tag" style={{ color: 'var(--warning)' }}>Security & Compliance</span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 750, marginTop: '0.2rem' }}>Platform Audit Trail</h2>
          <p style={{ fontSize: '0.85rem' }}>Immutable record of all super-admin interventions and moderation events</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            data-testid="audit-action-filter"
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
        <div style={{ padding: '0.75rem 1rem', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Target Workspace</th>
              <th>Admin User</th>
              <th>Event Details / Reason</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="pulse-glow">Loading audit events...</div>
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
                <tr key={log.id}>
                  <td>
                    <span className="status-pill warning" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.tenant_name || 'Global / System'}</div>
                    <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.tenant_id}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{log.admin_email || 'Super Admin'}</div>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.details?.reason || (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details)}
                    </div>
                  </td>
                  <td className="font-mono tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="tabular-nums" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <span className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} audit logs recorded)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="btn-icon"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="btn-icon"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
