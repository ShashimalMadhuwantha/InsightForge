import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export function LimitReachedModal({
  isOpen,
  onClose,
  limitType = 'data_sources',
  currentUsage = 0,
  maxLimit = 0,
  featureName = '',
  requiredTier = 'Starter Team',
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getLimitDetails = () => {
    switch (limitType) {
      case 'sub_users':
        return {
          title: 'Sub-User Seat Limit Reached',
          subtitle: `You have reached the maximum of ${maxLimit} sub-user seat(s) on your current plan.`,
          benefits: [
            'Invite up to 25 team members with role-based governance',
            'Granular dataset and dashboard sharing permissions',
            'Collaborative live analysis comments',
          ],
        };
      case 'data_sources':
        return {
          title: 'Data Sources Limit Reached',
          subtitle: `You have connected ${currentUsage} of ${maxLimit} allowable data sources.`,
          benefits: [
            'Connect up to 50 concurrent Excel & CSV datasets',
            'Automated daily schema profiling and quality scoring',
            'Multi-sheet parsing with cross-table analytics',
          ],
        };
      case 'file_size':
        return {
          title: 'File Size Quota Exceeded',
          subtitle: `Your upload exceeds the ${maxLimit}MB per-file maximum for your active tier.`,
          benefits: [
            'Upload large enterprise datasets up to 500MB',
            'High-throughput asynchronous background parsing',
            'Deep outlier and statistical cleansing routines',
          ],
        };
      case 'cleansing_op':
        return {
          title: 'Gated Data Cleansing Operation',
          subtitle: `The '${featureName || 'advanced'}' cleansing operation is available on ${requiredTier} and above.`,
          benefits: [
            'Automated missing value imputation & outlier removal',
            'Schema standardization and type inference rules',
            'Immutable audit log of all data transformations',
          ],
        };
      case 'widget_type':
        return {
          title: 'Premium Visualization Widget',
          subtitle: `The '${featureName || 'advanced'}' chart type requires the ${requiredTier} plan.`,
          benefits: [
            'Unlock Donut, Scatter, Area, and Multi-Axis KPI cards',
            'Custom color scales and dynamic goal thresholds',
            'High-density dashboard export to PDF & SVG',
          ],
        };
      case 'insight_depth':
        return {
          title: 'Deep AI Predictive Insights',
          subtitle: `Predictive and deep automated insights require ${requiredTier}.`,
          benefits: [
            'Anomaly detection and multi-variable correlations',
            'Automated executive summaries and trend forecasts',
            'Natural language explanation of data variances',
          ],
        };
      default:
        return {
          title: 'Subscription Limit Reached',
          subtitle: 'Upgrade your subscription tier to unlock unlimited capacity and features.',
          benefits: [
            'Higher resource quotas and prioritized compute',
            'Advanced BI analytics and full visualization suite',
            '24/7 Priority enterprise support',
          ],
        };
    }
  };

  const details = getLimitDetails();

  const handleUpgradeClick = () => {
    onClose();
    navigate('/packages');
  };

  return (
    <div className="modal-backdrop" data-testid="limit-reached-modal">
      <div className="modal-box" style={{ maxWidth: '520px', padding: '2.25rem', position: 'relative' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-icon"
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            width: '32px',
            height: '32px',
          }}
          data-testid="close-limit-modal-btn"
        >
          <X size={16} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--accent-glow)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow-subtle)',
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <span className="section-tag" style={{ color: 'var(--accent-primary)' }}>Plan Entitlement Limit</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', marginTop: '0.15rem' }}>
              {details.title}
            </h3>
          </div>
        </div>

        {/* Subtitle / Context description */}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {details.subtitle}
        </p>

        {/* Benefits Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Zap size={15} color="var(--warning)" />
            <span>Unlock with Plan Upgrade:</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {details.benefits.map((benefit, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            data-testid="dismiss-limit-modal-btn"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="btn btn-primary"
            data-testid="upgrade-now-btn"
            style={{ padding: '0.75rem 1.25rem' }}
          >
            <span>View Upgrade Plans</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
