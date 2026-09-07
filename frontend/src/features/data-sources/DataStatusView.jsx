import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Activity, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft, 
  Table, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  Trash2
} from 'lucide-react';
import { dataSourceService } from '../../services/dataSourceService';

export function DataStatusView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dataSource, setDataSource] = useState(null);
  const [sampleData, setSampleData] = useState(null);
  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'preview' | 'versions'
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshFileInputRef = useRef(null);

  const fetchDataSource = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await dataSourceService.getDataSourceById(id);
      setDataSource(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load data source report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewData = async () => {
    if (sampleData) return;
    setPreviewLoading(true);
    try {
      const data = await dataSourceService.getDataSourcePreview(id, 50);
      setSampleData(data);
    } catch {
      // preview error handled gracefully
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSource();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'preview') {
      fetchPreviewData();
    }
  }, [activeTab]);

  const handleRefreshFileChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setRefreshing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await dataSourceService.refreshDataSource(id, file);
      setSuccessMessage('Dataset refresh uploaded! Processing new schema version...');
      setTimeout(() => {
        fetchDataSource();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to refresh dataset.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete dataset '${dataSource?.name}'?`)) return;
    try {
      await dataSourceService.deleteDataSource(id);
      navigate('/data-sources');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete dataset.');
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'numeric':
        return (
          <span className="status-pill active" style={{ fontSize: '0.7rem' }}>
            <Hash size={12} /> Number
          </span>
        );
      case 'date':
        return (
          <span className="status-pill info" style={{ fontSize: '0.7rem' }}>
            <Calendar size={12} /> Date
          </span>
        );
      case 'boolean':
        return (
          <span className="status-pill warning" style={{ fontSize: '0.7rem' }}>
            <ToggleLeft size={12} /> Boolean
          </span>
        );
      default:
        return (
          <span className="status-pill" style={{ fontSize: '0.7rem' }}>
            <Type size={12} /> String
          </span>
        );
    }
  };

  if (loading && !dataSource) {
    return (
      <div style={{ maxWidth: '1240px', margin: '4rem auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="pulse-glow" style={{ fontSize: '1rem', fontWeight: 600 }}>
          Loading dataset schema & quality profile...
        </div>
      </div>
    );
  }

  const qualityScore = dataSource?.quality_metrics?.overall_score ?? 100;
  const completeness = dataSource?.quality_metrics?.completeness_pct ?? 100;
  const missingCount = dataSource?.quality_metrics?.missing_values_count ?? 0;
  const duplicateCount = dataSource?.quality_metrics?.duplicate_rows_count ?? 0;

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Hidden Refresh File Input */}
      <input
        ref={refreshFileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleRefreshFileChange}
        style={{ display: 'none' }}
        data-testid="refresh-file-input"
      />

      {/* Navigation Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/data-sources" className="btn-icon" title="Back to Datasets">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {dataSource?.name || 'Dataset Profile'}
              </h1>
              <span className="status-pill info" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                v{dataSource?.current_version || 1}
              </span>
              <span className={`status-pill ${dataSource?.status === 'ready' ? 'active' : dataSource?.status === 'error' ? 'error' : 'trialing'}`}>
                <span className={`live-dot ${dataSource?.status === 'ready' ? 'live-dot-success pulse' : 'live-dot-error'}`} />
                {dataSource?.status || 'Processing'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              File: <code className="font-mono" style={{ color: 'var(--accent-secondary)' }}>{dataSource?.original_filename}</code> &bull; Type: <strong>{dataSource?.file_type?.toUpperCase()}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => refreshFileInputRef.current?.click()}
            disabled={refreshing}
            className="btn btn-outline"
            data-testid="refresh-dataset-btn"
          >
            <Upload size={15} />
            <span>{refreshing ? 'Re-uploading...' : 'Re-upload / Refresh'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="btn-icon"
            title="Delete Data Source"
            data-testid="delete-dataset-btn"
          >
            <Trash2 size={16} color="var(--error)" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div data-testid="status-success-alert" style={{ padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div data-testid="status-error-alert" style={{ padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Metric Cards Grid (Tremor style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Quality Score Card */}
        <div className="stat-card" data-testid="quality-score-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="section-tag" style={{ color: qualityScore >= 80 ? 'var(--success)' : qualityScore >= 50 ? 'var(--warning)' : 'var(--error)' }}>
              Data Quality Index
            </span>
            <div style={{ background: qualityScore >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: qualityScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '2.25rem', fontWeight: 850, letterSpacing: '-0.03em', color: qualityScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
            {qualityScore}<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>/100</span>
          </div>
          <div className="progress-track" style={{ height: '6px', marginTop: '0.75rem' }}>
            <div
              className="progress-fill"
              style={{
                width: `${qualityScore}%`,
                background: qualityScore >= 80 ? 'var(--success)' : qualityScore >= 50 ? 'var(--warning)' : 'var(--error)',
              }}
            />
          </div>
        </div>

        {/* Dataset Volume */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="section-tag">Total Dimensions</span>
            <div style={{ background: 'var(--accent-glow)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
              <Table size={18} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '2.25rem', fontWeight: 850, letterSpacing: '-0.03em' }}>
            {dataSource?.row_count?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Rows across <strong style={{ color: 'var(--text-primary)' }}>{dataSource?.column_count || 0}</strong> detected columns
          </div>
        </div>

        {/* Completeness */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="section-tag">Completeness Rate</span>
            <div style={{ background: 'var(--info-bg)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: 'var(--info)' }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '2.25rem', fontWeight: 850, letterSpacing: '-0.03em' }}>
            {completeness}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            <strong style={{ color: missingCount > 0 ? 'var(--warning)' : 'var(--success)' }}>{missingCount.toLocaleString()}</strong> null/missing values
          </div>
        </div>

        {/* Uniqueness */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="section-tag">Row Uniqueness</span>
            <div style={{ background: 'var(--accent-glow)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '2.25rem', fontWeight: 850, letterSpacing: '-0.03em' }}>
            {duplicateCount === 0 ? '100%' : `${(100 - (duplicateCount / (dataSource?.row_count || 1) * 100)).toFixed(1)}%`}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            <strong style={{ color: duplicateCount > 0 ? 'var(--warning)' : 'var(--success)' }}>{duplicateCount}</strong> duplicate rows detected
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('schema')}
          className={`btn-ghost ${activeTab === 'schema' ? 'active-tab' : ''}`}
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'schema' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'schema' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'schema' ? 750 : 550,
            cursor: 'pointer',
            fontSize: '0.925rem',
            borderRadius: 0,
          }}
          data-testid="schema-tab-btn"
        >
          Schema & Inferred Types ({dataSource?.schema_profile?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`btn-ghost ${activeTab === 'preview' ? 'active-tab' : ''}`}
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'preview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'preview' ? 750 : 550,
            cursor: 'pointer',
            fontSize: '0.925rem',
            borderRadius: 0,
          }}
          data-testid="preview-tab-btn"
        >
          Data Preview Sample (Top 50)
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`btn-ghost ${activeTab === 'versions' ? 'active-tab' : ''}`}
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'versions' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'versions' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'versions' ? 750 : 550,
            cursor: 'pointer',
            fontSize: '0.925rem',
            borderRadius: 0,
          }}
          data-testid="versions-tab-btn"
        >
          Version History ({dataSource?.versions?.length || 1})
        </button>
      </div>

      {/* Tab 1: Schema Profile Table */}
      {activeTab === 'schema' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Column Name</th>
                  <th>Inferred Type</th>
                  <th>Null / Missing Count</th>
                  <th>Missing Rate</th>
                  <th>Sample Values</th>
                </tr>
              </thead>
              <tbody>
                {(!dataSource?.schema_profile || dataSource.schema_profile.length === 0) ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No schema detected.
                    </td>
                  </tr>
                ) : (
                  dataSource.schema_profile.map((col, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{col.name}</strong>
                      </td>
                      <td>{getTypeBadge(col.type)}</td>
                      <td className="tabular-nums">{col.nullCount?.toLocaleString() || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="tabular-nums" style={{ fontSize: '0.8rem', color: col.nullPct > 20 ? 'var(--error)' : 'var(--text-muted)' }}>
                            {col.nullPct || 0}%
                          </span>
                          <div className="progress-track" style={{ width: '60px', height: '4px' }}>
                            <div className="progress-fill" style={{ width: `${col.nullPct || 0}%`, background: col.nullPct > 20 ? 'var(--error)' : 'var(--accent-secondary)' }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {(col.sampleValues || []).slice(0, 3).map((val, vIdx) => (
                            <span key={vIdx} className="font-mono" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', fontSize: '0.725rem' }}>
                              {String(val)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sample Preview Table */}
      {activeTab === 'preview' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          {previewLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="pulse-glow">Loading raw preview rows...</div>
            </div>
          ) : (!sampleData?.sampleRows || sampleData.sampleRows.length === 0) ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No preview data available for this dataset.
            </div>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    {Object.keys(sampleData.sampleRows[0] || {}).map((header, idx) => (
                      <th key={idx} style={{ whiteSpace: 'nowrap' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.sampleRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Object.keys(row).map((k, cIdx) => (
                        <td key={cIdx} className="tabular-nums" style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                          {row[k] === null || row[k] === undefined ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>
                          ) : (
                            String(row[k])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Version History */}
      {activeTab === 'versions' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>File Size</th>
                  <th>Row Count</th>
                  <th>Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {(dataSource?.versions || []).map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="status-pill info">Version {v.version_number}</span>
                    </td>
                    <td className="tabular-nums">{(v.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</td>
                    <td className="tabular-nums">{v.row_count?.toLocaleString() || 0} rows</td>
                    <td className="tabular-nums">{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
