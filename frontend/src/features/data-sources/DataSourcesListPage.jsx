import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Eye, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  Table,
  UploadCloud
} from 'lucide-react';
import { dataSourceService } from '../../services/dataSourceService';

export function DataSourcesListPage() {
  const [dataSources, setDataSources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const fetchDataSources = async (page = 1) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await dataSourceService.listDataSources({
        page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      });
      setDataSources(res.dataSources || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDataSources(1);
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete dataset '${name}'? This cannot be undone.`)) return;

    try {
      await dataSourceService.deleteDataSource(id);
      fetchDataSources(pagination.page);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete dataset.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="status-pill active" data-testid="status-badge-ready">
            <span className="live-dot live-dot-success pulse" /> Ready
          </span>
        );
      case 'processing':
        return (
          <span className="status-pill trialing" data-testid="status-badge-processing">
            <span className="live-dot live-dot-info pulse" /> Parsing...
          </span>
        );
      case 'error':
        return (
          <span className="status-pill error" data-testid="status-badge-error">
            <span className="live-dot live-dot-error" /> Error
          </span>
        );
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="section-tag">Dataset Repository</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '0.2rem' }}>
            Connected Data Sources
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Upload, inspect schemas, monitor quality scores, and maintain dataset versions.
          </p>
        </div>

        <Link
          to="/data-sources/upload"
          className="btn btn-primary"
          data-testid="connect-datasource-btn"
          style={{ padding: '0.65rem 1.25rem', gap: '0.5rem' }}
        >
          <Plus size={16} />
          <span>Connect Data Source</span>
        </Link>
      </div>

      {errorMessage && (
        <div data-testid="list-error-alert" style={{ padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Glass Panel & Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search datasets by name or filename..."
                data-testid="search-datasets-input"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </form>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="status-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="error">Error</option>
            </select>

            <button
              onClick={() => fetchDataSources(pagination.page)}
              className="btn-icon"
              title="Refresh list"
              disabled={loading}
              data-testid="refresh-list-btn"
            >
              <RefreshCw size={16} className={loading ? 'pulse-glow' : ''} />
            </button>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Dataset Name</th>
                <th>Format</th>
                <th>Status</th>
                <th>Dimensions</th>
                <th>Quality Score</th>
                <th>Version</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && dataSources.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div className="pulse-glow">Loading datasets...</div>
                  </td>
                </tr>
              ) : dataSources.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ maxWidth: '380px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--accent-glow)', padding: '1rem', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)' }}>
                        <UploadCloud size={28} />
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 750 }}>No Data Sources Connected</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Connect your first Excel or CSV file to enable automated schema parsing and visual analytics.
                      </p>
                      <Link to="/data-sources/upload" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                        Upload First Dataset
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                dataSources.map((ds) => {
                  const score = ds.quality_metrics?.overall_score ?? (ds.status === 'ready' ? 100 : 0);

                  return (
                    <tr
                      key={ds.id}
                      onClick={() => navigate(`/data-sources/${ds.id}/status`)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`datasource-row-${ds.id}`}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <FileSpreadsheet size={18} color="var(--accent-secondary)" />
                          <div>
                            <div style={{ fontWeight: 750, color: 'var(--text-primary)' }}>{ds.name}</div>
                            <div className="font-mono" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {ds.original_filename}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-pill info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {ds.file_type}
                        </span>
                      </td>
                      <td>{getStatusBadge(ds.status)}</td>
                      <td>
                        <div className="tabular-nums" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          <strong>{ds.row_count?.toLocaleString() || 0}</strong> rows
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ds.column_count || 0} columns
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            className="tabular-nums"
                            style={{
                              fontWeight: 750,
                              fontSize: '0.85rem',
                              color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)',
                            }}
                          >
                            {score}%
                          </span>
                          <div className="progress-track" style={{ width: '45px', height: '4px' }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${score}%`,
                                background: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-pill" style={{ fontSize: '0.7rem' }}>
                          v{ds.current_version || 1}
                        </span>
                      </td>
                      <td className="tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(ds.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/data-sources/${ds.id}/status`}
                            className="btn-icon"
                            title="Inspect Schema & Quality Profile"
                            data-testid={`inspect-ds-${ds.id}`}
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(ds.id, ds.name, e)}
                            className="btn-icon"
                            title="Delete dataset"
                            data-testid={`delete-ds-${ds.id}`}
                          >
                            <Trash2 size={16} color="var(--error)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
