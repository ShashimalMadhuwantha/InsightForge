import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { 
  Activity, 
  Database, 
  Server, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu 
} from 'lucide-react';

export function HealthStatusView() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();
    try {
      const data = await apiClient.get('/api/health');
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setError(err.message || 'Failed to connect to backend service');
      if (err.data) {
        setHealthData(err.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const isHealthy = healthData?.status === 'ok';

  return (
    <div style={{ maxWidth: '860px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Activity size={24} />
            </div>
            <div>
              <span className="section-tag">Infrastructure Telemetry</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 750, marginTop: '0.2rem' }}>System Health & Connectivity</h2>
              <p style={{ fontSize: '0.85rem' }}>Real-time telemetry for Core Services & Database</p>
            </div>
          </div>
          
          <button 
            className="btn btn-outline" 
            onClick={fetchHealthStatus}
            disabled={loading}
            data-testid="refresh-btn"
          >
            <RefreshCw size={16} className={loading ? 'pulse-glow' : ''} />
            <span>{loading ? 'Pinging...' : 'Refresh Status'}</span>
          </button>
        </div>

        {/* Global Status Banner */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: isHealthy ? 'var(--success-bg)' : 'var(--error-bg)',
          border: `1px solid ${isHealthy ? 'var(--success-border)' : 'var(--error-border)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
        data-testid="global-status-banner"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {isHealthy ? (
              <CheckCircle2 color="var(--success)" size={26} />
            ) : (
              <AlertCircle color="var(--error)" size={26} />
            )}
            <div>
              <div style={{ fontWeight: 750, fontSize: '1.05rem', color: isHealthy ? 'var(--success)' : 'var(--error)' }}>
                {loading && !healthData ? 'Checking services...' : isHealthy ? 'All Infrastructure Systems Operational' : 'Degraded System Performance'}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {error ? error : `Uptime: ${healthData?.uptimeFormatted || 'N/A'}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {latency !== null && (
              <span className="status-pill success tabular-nums" style={{ textTransform: 'none' }}>
                <Clock size={12} /> {latency} ms latency
              </span>
            )}
            {lastChecked && (
              <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Checked at {lastChecked}
              </span>
            )}
          </div>
        </div>

        {/* Service Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Backend API */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Server size={18} color="var(--accent-secondary)" />
                <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Express Backend</span>
              </div>
              <span className={`status-pill ${healthData?.status ? 'active' : 'suspended'}`} data-testid="backend-status-badge">
                <span className={`live-dot ${healthData?.status ? 'live-dot-success pulse' : 'live-dot-error'}`} />
                {healthData?.status ? 'Online' : 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Environment: <code className="font-mono" style={{ color: 'var(--accent-secondary)' }}>{healthData?.environment || 'development'}</code>
            </p>
          </div>

          {/* Database */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Database size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>PostgreSQL</span>
              </div>
              <span className={`status-pill ${healthData?.services?.db === 'healthy' ? 'active' : 'suspended'}`} data-testid="db-status-badge">
                <span className={`live-dot ${healthData?.services?.db === 'healthy' ? 'live-dot-success pulse' : 'live-dot-error'}`} />
                {healthData?.services?.db || 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Pool: <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{healthData?.services?.dbPool?.used ?? 0} active</strong> / {healthData?.services?.dbPool?.total ?? 10} max
            </p>
          </div>

          {/* Redis Cache */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Layers size={18} color="var(--error)" />
                <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Redis Cache</span>
              </div>
              <span className={`status-pill ${healthData?.services?.redis === 'healthy' ? 'active' : 'suspended'}`} data-testid="redis-status-badge">
                <span className={`live-dot ${healthData?.services?.redis === 'healthy' ? 'live-dot-success pulse' : 'live-dot-error'}`} />
                {healthData?.services?.redis || 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Mode: <code className="font-mono" style={{ color: 'var(--accent-secondary)' }}>{healthData?.services?.redisMode || 'cluster/standalone'}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
