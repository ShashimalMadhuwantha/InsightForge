import React, { useState, useEffect } from 'react';
import { Shield, Building2, FileText, RefreshCw, Layers } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { GlobalAnalyticsOverview } from './GlobalAnalyticsOverview';
import { TenantDirectoryPage } from './TenantDirectoryPage';
import { AuditLogsPage } from './AuditLogsPage';

export function SuperAdminLayout() {
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'audit'
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await adminService.getGlobalAnalytics();
      setAnalytics(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Super Admin Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: 'var(--accent-glow)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Shield size={14} />
            <span>PLATFORM SUPER ADMIN CONTROL CENTER</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Global Multi-Tenant Monitoring
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Real-time telemetry, tenant moderation, plan overrides, and platform-wide audit trail
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="btn btn-outline"
          data-testid="refresh-analytics-btn"
        >
          <RefreshCw size={16} className={loadingAnalytics ? 'pulse-glow' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Global Telemetry KPI Overview */}
      <GlobalAnalyticsOverview analytics={analytics} loading={loadingAnalytics} />

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('tenants')}
          data-testid="admin-tenants-tab"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tenants' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'tenants' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'tenants' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Building2 size={18} color={activeTab === 'tenants' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
          <span>Tenant Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          data-testid="admin-audit-tab"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'audit' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <FileText size={18} color={activeTab === 'audit' ? 'var(--warning)' : 'var(--text-muted)'} />
          <span>Platform Audit Trail</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tenants' ? <TenantDirectoryPage /> : <AuditLogsPage />}
    </div>
  );
}
