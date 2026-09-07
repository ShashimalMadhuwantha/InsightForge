import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GlobalAnalyticsOverview } from '../GlobalAnalyticsOverview';

describe('GlobalAnalyticsOverview Component', () => {
  it('renders loading state when analytics is null and loading is true', () => {
    render(<GlobalAnalyticsOverview analytics={null} loading={true} />);
    expect(screen.getByText(/loading platform analytics telemetry/i)).toBeInTheDocument();
  });

  it('renders KPI metrics and subscription tier distribution cards', () => {
    const mockAnalytics = {
      metrics: {
        totalTenants: 12,
        activeTenants: 10,
        suspendedTenants: 2,
        totalUsers: 48,
        totalAuditLogs: 15,
      },
      tierDistribution: [
        { id: 'free', name: 'Free Explorer', count: 5 },
        { id: 'starter', name: 'Starter Team', count: 4 },
        { id: 'enterprise', name: 'Enterprise Pro', count: 3 },
      ],
    };

    render(<GlobalAnalyticsOverview analytics={mockAnalytics} loading={false} />);

    expect(screen.getByTestId('metric-total-tenants')).toHaveTextContent('12');
    expect(screen.getByTestId('metric-active-tenants')).toHaveTextContent('10');
    expect(screen.getByTestId('metric-suspended-tenants')).toHaveTextContent('2');
    expect(screen.getByTestId('metric-total-users')).toHaveTextContent('48');
    expect(screen.getByTestId('metric-audit-logs')).toHaveTextContent('15');

    expect(screen.getByText('Free Explorer')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Pro')).toBeInTheDocument();
  });
});
