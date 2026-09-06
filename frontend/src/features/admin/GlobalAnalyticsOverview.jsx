import React from 'react';
import { Building2, Users, CheckCircle2, AlertOctagon, Layers, FileText, Activity } from 'lucide-react';

export function GlobalAnalyticsOverview({ analytics, loading }) {
  if (loading && !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        Loading platform analytics telemetry...
      </div>
    );
  }

  const { metrics = {}, tierDistribution = [] } = analytics || {};

  return (
    <div>
      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {/* Total Tenants */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Workspaces</span>
            <div style={{ background: 'var(--accent-glow)', padding: '0.4rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }} data-testid="metric-total-tenants">
            {metrics.totalTenants ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Across all subscription tiers
          </div>
        </div>

        {/* Active Tenants */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Tenants</span>
            <div style={{ background: 'var(--success-bg)', padding: '0.4rem', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }} data-testid="metric-active-tenants">
            {metrics.activeTenants ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Fully operational
          </div>
        </div>

        {/* Suspended Tenants */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Suspended</span>
            <div style={{ background: 'var(--error-bg)', padding: '0.4rem', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>
              <AlertOctagon size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)' }} data-testid="metric-suspended-tenants">
            {metrics.suspendedTenants ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Access restricted
          </div>
        </div>

        {/* Total Platform Users */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Users</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.4rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-secondary)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }} data-testid="metric-total-users">
            {metrics.totalUsers ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            All tenant members
          </div>
        </div>

        {/* Total Audit Logs */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Admin Interventions</span>
            <div style={{ background: 'var(--warning-bg)', padding: '0.4rem', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }} data-testid="metric-audit-logs">
            {metrics.totalAuditLogs ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Recorded audit events
          </div>
        </div>
      </div>

      {/* Subscription Tier Distribution Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.45rem', borderRadius: 'var(--radius-md)', color: '#fff' }}>
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Subscription Tier Distribution</h3>
            <p style={{ fontSize: '0.8rem' }}>Active tenant workspaces partitioned by subscription package</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {tierDistribution.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tier.name}</span>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{tier.id}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {tier.count} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>tenants</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
