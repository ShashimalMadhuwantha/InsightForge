import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  X,
  FileText,
  Layers
} from 'lucide-react';
import { dataSourceService } from '../../services/dataSourceService';
import { LimitReachedModal } from '../packages/LimitReachedModal';

export function DataSourceUploadPage() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingStatus, setParsingStatus] = useState(''); // 'uploading' | 'processing' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [quotaExceededModal, setQuotaExceededModal] = useState({ isOpen: false, limitType: 'data_sources', currentUsage: 2, maxLimit: 2 });
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setErrorMessage('Unsupported file format. Please choose an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selectedFile);
    if (!name) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(baseName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const pollStatusUntilReady = async (dataSourceId) => {
    setParsingStatus('processing');
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await dataSourceService.getDataSourceStatus(dataSourceId);
        if (res.data?.status === 'ready') {
          clearInterval(interval);
          setParsingStatus('ready');
          setTimeout(() => {
            navigate(`/data-sources/${dataSourceId}/status`);
          }, 1000);
        } else if (res.data?.status === 'error') {
          clearInterval(interval);
          setParsingStatus('error');
          setErrorMessage(res.data?.errorMessage || 'File parsing failed.');
          setUploading(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          // Still navigate even if slow, user can view status page
          navigate(`/data-sources/${dataSourceId}/status`);
        }
      } catch {
        // continue polling
      }
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select or drag an Excel or CSV file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setParsingStatus('uploading');
    setErrorMessage('');

    try {
      setUploadProgress(40);
      const res = await dataSourceService.uploadDataSource(file, name);
      setUploadProgress(100);

      const dataSourceId = res.data?.id;
      if (dataSourceId) {
        await pollStatusUntilReady(dataSourceId);
      } else {
        navigate('/data-sources');
      }
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      setParsingStatus('');

      if (err.response?.data?.code === 'QUOTA_EXCEEDED') {
        const details = err.response?.data?.details || {};
        setQuotaExceededModal({
          isOpen: true,
          limitType: details.resourceType || 'data_sources',
          currentUsage: details.current || 2,
          maxLimit: details.limit || 2,
        });
      } else {
        setErrorMessage(err.message || 'Failed to upload dataset.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2.5rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Top Section */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', background: 'var(--accent-glow)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Sparkles size={14} />
          <span>DATASET INGESTION PIPELINE</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 850, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
          Connect Data Source
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
          Upload your Excel workbook or CSV data. Our automated worker will extract sheets, detect data types, and generate a Data Quality Report.
        </p>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        {errorMessage && (
          <div
            data-testid="upload-error-alert"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1.75rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dataset Name */}
          <div className="form-group">
            <label className="form-label">
              Dataset Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Global Revenue & Expenses"
              disabled={uploading}
              data-testid="dataset-name-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            data-testid="dropzone-area"
            style={{
              border: dragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              background: dragActive ? 'var(--accent-glow)' : 'var(--bg-secondary)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              position: 'relative',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              data-testid="file-input"
              disabled={uploading}
            />

            <div style={{
              background: 'var(--accent-gradient)',
              padding: '1rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-inverse)',
              boxShadow: 'var(--accent-glow-subtle)',
            }}>
              <UploadCloud size={32} />
            </div>

            {file ? (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-medium)', marginBottom: '0.5rem' }}>
                  <FileSpreadsheet size={16} color="var(--accent-secondary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{file.name}</span>
                  <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="btn-icon"
                      style={{ width: '20px', height: '20px', marginLeft: '0.25rem' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click or drop another file to replace</p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: '0.35rem' }}>
                  {dragActive ? 'Drop dataset file here' : 'Click to select or drag & drop file'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Supports Microsoft Excel (.xlsx, .xls) and standard Comma-Separated Values (.csv)
                </p>
                <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center' }}>
                  <span className="status-pill info" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>.XLSX</span>
                  <span className="status-pill info" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>.XLS</span>
                  <span className="status-pill info" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>.CSV</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress & Worker Telemetry */}
          {uploading && (
            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 650 }}>
                  <RefreshCw size={14} className="pulse-glow" />
                  <span>
                    {parsingStatus === 'uploading' && 'Streaming file to tenant storage...'}
                    {parsingStatus === 'processing' && 'Inferring column data types & computing quality score...'}
                    {parsingStatus === 'ready' && 'Schema ready! Loading profile...'}
                  </span>
                </div>
                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{uploadProgress}%</span>
              </div>

              <div className="progress-track" style={{ width: '100%', height: '6px' }}>
                <div className="progress-fill" style={{ width: `${uploadProgress}%`, background: 'var(--accent-gradient)' }} />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <Link to="/data-sources" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
              &larr; Back to Datasets
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!file || uploading}
              data-testid="submit-upload-btn"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="pulse-glow" />
                  <span>Ingesting Dataset...</span>
                </>
              ) : (
                <>
                  <span>Upload & Analyze Data</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reusable Limit Reached Modal */}
      <LimitReachedModal
        isOpen={quotaExceededModal.isOpen}
        onClose={() => setQuotaExceededModal((prev) => ({ ...prev, isOpen: false }))}
        limitType={quotaExceededModal.limitType}
        currentUsage={quotaExceededModal.currentUsage}
        maxLimit={quotaExceededModal.maxLimit}
      />
    </div>
  );
}
