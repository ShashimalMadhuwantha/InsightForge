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
    <div style={{ maxWidth: '840px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Activity size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Health & Connectivity</h2>
                <p style={{ fontSize: '0.875rem' }}>Real-time telemetry for Core Services & Database</p>
              </div>
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
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isHealthy ? 'var(--success-bg)' : 'var(--error-bg)',
          border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
        data-testid="global-status-banner"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isHealthy ? (
              <CheckCircle2 color="var(--success)" size={24} />
            ) : (
              <AlertCircle color="var(--error)" size={24} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: isHealthy ? 'var(--success)' : 'var(--error)' }}>
                {loading && !healthData ? 'Checking services...' : isHealthy ? 'All Infrastructure Systems Operational' : 'Degraded System Performance'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {error ? error : `Uptime: ${healthData?.uptimeFormatted || 'N/A'}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {latency !== null && (
              <span className="badge badge-success" style={{ textTransform: 'none' }}>
                <Clock size={12} /> {latency} ms latency
              </span>
            )}
            {lastChecked && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Checked at {lastChecked}
              </span>
            )}
          </div>
        </div>

        {/* Service Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Backend API */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Server size={18} color="var(--accent-secondary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Express Backend</span>
              </div>
              <span className={`badge ${healthData?.status ? 'badge-success' : 'badge-error'}`} data-testid="backend-status-badge">
                {healthData?.status ? 'Online' : 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Environment: <code style={{ color: 'var(--accent-secondary)' }}>{healthData?.environment || 'development'}</code>
            </p>
          </div>

          {/* Database */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Database size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>PostgreSQL</span>
              </div>
              <span className={`badge ${healthData?.services?.db === 'healthy' ? 'badge-success' : 'badge-error'}`} data-testid="db-status-badge">
                {healthData?.services?.db || 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Type: Shared Multi-Tenant Schema
            </p>
          </div>

          {/* Redis Cache */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Layers size={18} color="var(--warning)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Redis Broker</span>
              </div>
              <span className={`badge ${healthData?.services?.redis === 'healthy' ? 'badge-success' : 'badge-error'}`} data-testid="redis-status-badge">
                {healthData?.services?.redis || 'Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Usage: BullMQ Queue & Session Cache
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
