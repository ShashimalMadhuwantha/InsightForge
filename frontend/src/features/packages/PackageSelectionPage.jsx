import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { packageService } from '../../services/packageService';
import { useAuth } from '../auth/AuthContext';

export function PackageSelectionPage() {
  const { tenant, updateTenantState } = useAuth();
  const [packages, setPackages] = useState([]);
  const [quotaReport, setQuotaReport] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'annual'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // packageId being upgraded
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [pkgsData, myPlanData] = await Promise.all([
        packageService.getAllPackages(),
        packageService.getMyPlan().catch(() => null),
      ]);
      setPackages(pkgsData || []);
      if (myPlanData) {
        setQuotaReport(myPlanData);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentPackageId = quotaReport?.package?.packageId || tenant?.packageId || 'free';

  const handleSelectPackage = async (pkg) => {
    if (pkg.id === currentPackageId) return;

    setActionLoading(pkg.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (pkg.price_monthly === 0) {
        // Direct downgrade / switch to free
        const res = await packageService.changePlan(pkg.id);
        updateTenantState({ packageId: pkg.id, package: res.data?.package });
        setSuccessMessage(`Successfully switched to ${pkg.name}!`);
        await loadData();
      } else {
        // Simulated Stripe Checkout flow & Instant Webhook Activation (Task 3.7)
        const session = await packageService.createCheckoutSession(pkg.id, billingInterval);
        
        // Auto-activate demo webhook in development/test environments
        if (tenant?.id) {
          await packageService.simulateWebhookPayment(tenant.id, pkg.id);
        }
        
        updateTenantState({ packageId: pkg.id, package: pkg });
        setSuccessMessage(`Plan upgraded to ${pkg.name}! (Simulated checkout ref: ${session.sessionId.slice(0, 16)}...)`);
        await loadData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to change subscription plan.');
    } finally {
      setActionLoading(null);
    }
  };

  const calculatePrice = (monthlyPrice) => {
    if (monthlyPrice === 0) return '$0';
    if (billingInterval === 'annual') {
      const discounted = (monthlyPrice * 0.8).toFixed(0);
      return `$${discounted}`;
    }
    return `$${monthlyPrice.toFixed(0)}`;
  };

  if (loading && packages.length === 0) {
    return (
      <div style={{ maxWidth: '1240px', margin: '4rem auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="pulse-glow" style={{ fontSize: '1rem', fontWeight: 600 }}>
          Loading subscription tiers and usage telemetry...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Header & Title */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', background: 'var(--accent-glow)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
          <Sparkles size={14} />
          <span>FLEXIBLE MULTI-TENANT TIERS</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 850, letterSpacing: '-0.035em', marginBottom: '0.5rem' }}>
          Predictable Pricing for <span className="text-gradient">Every Scale</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Scale your analytics seamlessly. Instant feature unlocking, zero downtime, and server-side entitlement enforcement.
        </p>

        {/* Billing Interval Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', marginTop: '1.5rem' }}>
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`btn-ghost ${billingInterval === 'monthly' ? 'active-toggle' : ''}`}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 650,
              background: billingInterval === 'monthly' ? 'var(--bg-elevated)' : 'transparent',
              color: billingInterval === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: billingInterval === 'monthly' ? '1px solid var(--border-medium)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            data-testid="billing-monthly-btn"
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 650,
              background: billingInterval === 'annual' ? 'var(--bg-elevated)' : 'transparent',
              color: billingInterval === 'annual' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: billingInterval === 'annual' ? '1px solid var(--border-medium)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            data-testid="billing-annual-btn"
          >
            <span>Annual Billing</span>
            <span className="status-pill success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          data-testid="package-success-alert"
          style={{
            maxWidth: '860px',
            margin: '0 auto 2rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="package-error-alert"
          style={{
            maxWidth: '860px',
            margin: '0 auto 2rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMessage}</span>
        </div>
      )}

      {/* Pricing Cards Grid (Tremor / Linear style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {packages.map((pkg) => {
          const isCurrent = pkg.id === currentPackageId;
          const isPopular = pkg.id === 'growth';

          return (
            <div
              key={pkg.id}
              className={`interactive-card ${isPopular ? 'popular-card' : ''}`}
              data-testid={`package-card-${pkg.id}`}
              style={{
                background: isCurrent ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: isPopular ? '1px solid var(--accent-primary)' : isCurrent ? '1px solid var(--accent-secondary)' : '1px solid var(--border-subtle)',
                borderTop: isPopular ? '2px solid var(--accent-primary)' : '1px solid var(--border-card-highlight)',
                boxShadow: isPopular ? 'var(--accent-glow)' : 'var(--shadow-md)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--accent-gradient)',
                  color: 'var(--text-inverse)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: 'var(--accent-glow-subtle)',
                }}>
                  Most Popular
                </div>
              )}

              {/* Card Header */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{pkg.name}</h3>
                  {isCurrent && (
                    <span className="status-pill active" style={{ fontSize: '0.7rem' }}>
                      <Check size={12} /> Active Plan
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {pkg.id === 'free' && 'Ideal for evaluating automated schema parsing and simple reports.'}
                  {pkg.id === 'starter' && 'Great for growing teams needing multi-user sharing and exports.'}
                  {pkg.id === 'growth' && 'Advanced analytics, predictive insights, and full cleansing tools.'}
                  {pkg.id === 'enterprise' && 'High-throughput datasets, custom widgets, and dedicated compute.'}
                </p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                <span className="tabular-nums" style={{ fontSize: '2.5rem', fontWeight: 850, letterSpacing: '-0.04em' }}>
                  {calculatePrice(pkg.price_monthly)}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {pkg.price_monthly === 0 ? 'forever' : billingInterval === 'annual' ? '/ mo (billed yearly)' : '/ month'}
                </span>
              </div>

              {/* Key Limits Overview */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Check size={16} color="var(--accent-primary)" />
                  <span><strong>{pkg.limits?.max_sub_users}</strong> team sub-user(s)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Check size={16} color="var(--accent-primary)" />
                  <span><strong>{pkg.limits?.max_data_sources}</strong> data source connections</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Check size={16} color="var(--accent-primary)" />
                  <span>Up to <strong>{pkg.limits?.max_file_size_mb} MB</strong> per file</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Check size={16} color="var(--accent-primary)" />
                  <span style={{ textTransform: 'capitalize' }}><strong>{pkg.limits?.insight_depth}</strong> AI insight depth</span>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => handleSelectPackage(pkg)}
                  disabled={isCurrent || actionLoading !== null}
                  className={`btn ${isPopular ? 'btn-primary' : isCurrent ? 'btn-outline' : 'btn-primary'}`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    opacity: isCurrent ? 0.7 : 1,
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}
                  data-testid={`select-package-btn-${pkg.id}`}
                >
                  {actionLoading === pkg.id ? (
                    <>
                      <RefreshCw size={15} className="pulse-glow" />
                      <span>Activating Plan...</span>
                    </>
                  ) : isCurrent ? (
                    <span>Currently Active</span>
                  ) : pkg.price_monthly === 0 ? (
                    <span>Switch to Free Tier</span>
                  ) : (
                    <>
                      <span>Upgrade to {pkg.name.split(' ')[0]}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Entitlement Comparison Matrix */}
      <div className="glass-panel" style={{ padding: '2.25rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
            <Layers size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Feature & Limit Matrix</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Compare capabilities, resource boundaries, and analytics toolsets across all tiers
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Feature Capability</th>
                <th style={{ textAlign: 'center' }}>Free Explorer</th>
                <th style={{ textAlign: 'center' }}>Starter Team</th>
                <th style={{ textAlign: 'center' }}>Growth Business</th>
                <th style={{ textAlign: 'center' }}>Enterprise Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Team Sub-Users</strong></td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">1 User</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">5 Users</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">25 Users</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">1,000 Users</td>
              </tr>
              <tr>
                <td><strong>Data Sources Connections</strong></td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">2 Datasets</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">10 Datasets</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">50 Datasets</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">500 Datasets</td>
              </tr>
              <tr>
                <td><strong>Max File Upload Size</strong></td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">5 MB</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">25 MB</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">100 MB</td>
                <td style={{ textAlign: 'center' }} className="tabular-nums">500 MB</td>
              </tr>
              <tr>
                <td><strong>Data Cleansing Tools</strong></td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>Trim, Duplicates</td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>+ Fill Missing, Types</td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>+ Outlier Removal</td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>Full AI Suite (All Ops)</td>
              </tr>
              <tr>
                <td><strong>Visualization Widgets</strong></td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>Table, Bar, Line</td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>+ Pie, KPI Cards</td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>+ Scatter, Area, Donut</td>
                <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>Unlimited Custom (All)</td>
              </tr>
              <tr>
                <td><strong>AI Insight Depth</strong></td>
                <td style={{ textAlign: 'center' }}><span className="status-pill">Basic</span></td>
                <td style={{ textAlign: 'center' }}><span className="status-pill info">Standard</span></td>
                <td style={{ textAlign: 'center' }}><span className="status-pill active">Advanced</span></td>
                <td style={{ textAlign: 'center' }}><span className="status-pill success">Deep Predictive</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
