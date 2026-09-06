import React from 'react';
import { Building2, Users, CheckCircle2, AlertOctagon, Layers, FileText, TrendingUp } from 'lucide-react';

export function GlobalAnalyticsOverview({ analytics, loading }) {
  if (loading && !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        <div className="pulse-glow" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          Loading platform analytics telemetry...
        </div>
      </div>
    );
  }

  const { metrics = {}, tierDistribution = [] } = analytics || {};

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem',
      }}>
        {/* Total Tenants */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="section-tag">Total Workspaces</span>
            <div className="stat-icon-wrapper">
              <Building2 size={18} />
            </div>
          </div>
          <div className="stat-value tabular-nums" data-testid="metric-total-tenants">
            {metrics.totalTenants ?? 0}
          </div>
          <div className="stat-meta">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
              <TrendingUp size={13} /> Global
            </span>
            <span>across all tiers</span>
          </div>
        </div>

        {/* Active Tenants */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="section-tag" style={{ color: 'var(--success)' }}>Active Workspaces</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value tabular-nums" style={{ color: 'var(--success)' }} data-testid="metric-active-tenants">
            {metrics.activeTenants ?? 0}
          </div>
          <div className="stat-meta">
            <span className="live-dot live-dot-success pulse" />
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Operational</span>
            <span>100% data access</span>
          </div>
        </div>

        {/* Suspended Tenants */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="section-tag" style={{ color: 'var(--error)' }}>Suspended</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--error-bg)', color: 'var(--error)', borderColor: 'var(--error-border)' }}>
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="stat-value tabular-nums" style={{ color: 'var(--error)' }} data-testid="metric-suspended-tenants">
            {metrics.suspendedTenants ?? 0}
          </div>
          <div className="stat-meta">
            <span className="live-dot live-dot-error" />
            <span style={{ color: 'var(--error)', fontWeight: 600 }}>Restricted</span>
            <span>Sessions revoked</span>
          </div>
        </div>

        {/* Total Platform Users */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="section-tag" style={{ color: 'var(--accent-secondary)' }}>Platform Members</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-secondary)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value tabular-nums" data-testid="metric-total-users">
            {metrics.totalUsers ?? 0}
          </div>
          <div className="stat-meta">
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Registered Accounts</span>
            <span>across all tenants</span>
          </div>
        </div>

        {/* Total Audit Logs */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="section-tag" style={{ color: 'var(--warning)' }}>Audit Events</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning-border)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="stat-value tabular-nums" data-testid="metric-audit-logs">
            {metrics.totalAuditLogs ?? 0}
          </div>
          <div className="stat-meta">
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Immutable Trail</span>
            <span>recorded interventions</span>
          </div>
        </div>
      </div>

      {/* Subscription Tier Distribution Section */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 750 }}>Subscription Tier Distribution</h3>
              <p style={{ fontSize: '0.825rem' }}>Active tenant workspaces partitioned across subscription packages</p>
            </div>
          </div>
          <span className="status-pill info">
            <span className="live-dot live-dot-info pulse" /> Live Telemetry
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {tierDistribution.map((tier) => (
            <div
              key={tier.id}
              className="interactive-card"
              style={{
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                transition: 'all var(--transition-normal)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tier.name}</span>
                <span className="status-pill info" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', textTransform: 'uppercase' }}>
                  {tier.id}
                </span>
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
                {tier.count} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>tenants</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
