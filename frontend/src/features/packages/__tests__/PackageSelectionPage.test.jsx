import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PackageSelectionPage } from '../PackageSelectionPage';
import { AuthProvider } from '../../auth/AuthContext';
import { packageService } from '../../../services/packageService';

const mockPackages = [
  {
    id: 'free',
    name: 'Free Explorer',
    tier: 'free',
    price_monthly: 0,
    limits: { max_sub_users: 1, max_data_sources: 2, max_file_size_mb: 5, insight_depth: 'basic' },
  },
  {
    id: 'starter',
    name: 'Starter Team',
    tier: 'starter',
    price_monthly: 29,
    limits: { max_sub_users: 5, max_data_sources: 10, max_file_size_mb: 25, insight_depth: 'standard' },
  },
  {
    id: 'growth',
    name: 'Growth Business',
    tier: 'growth',
    price_monthly: 79,
    limits: { max_sub_users: 25, max_data_sources: 50, max_file_size_mb: 100, insight_depth: 'advanced' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pro',
    tier: 'enterprise',
    price_monthly: 199,
    limits: { max_sub_users: 1000, max_data_sources: 500, max_file_size_mb: 500, insight_depth: 'deep' },
  },
];

const mockQuotaReport = {
  package: { packageId: 'free', packageName: 'Free Explorer', tier: 'free' },
  usage: { users: 1, subUsers: 0, dataSources: 1 },
  quotas: {
    subUsers: { current: 0, max: 1, remaining: 1, isExceeded: false },
    dataSources: { current: 1, max: 2, remaining: 1, isExceeded: false },
    maxFileSizeMb: 5,
  },
};

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('PackageSelectionPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(packageService, 'getAllPackages').mockResolvedValue(mockPackages);
    vi.spyOn(packageService, 'getMyPlan').mockResolvedValue(mockQuotaReport);
  });

  it('renders all 4 subscription package cards and feature table', async () => {
    renderWithProviders(<PackageSelectionPage />);

    await waitFor(() => {
      expect(screen.getByTestId('package-card-free')).toBeInTheDocument();
      expect(screen.getByTestId('package-card-starter')).toBeInTheDocument();
      expect(screen.getByTestId('package-card-growth')).toBeInTheDocument();
      expect(screen.getByTestId('package-card-enterprise')).toBeInTheDocument();
    });

    expect(screen.getByText('Feature & Limit Matrix')).toBeInTheDocument();
  });

  it('toggles between monthly and annual billing with 20% discount', async () => {
    renderWithProviders(<PackageSelectionPage />);

    await waitFor(() => {
      expect(screen.getByText('$29')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('billing-annual-btn'));

    // 29 * 0.8 = 23.2 -> $23
    await waitFor(() => {
      expect(screen.getByText('$23')).toBeInTheDocument();
    });
  });

  it('triggers upgrade plan checkout session for a higher tier', async () => {
    vi.spyOn(packageService, 'createCheckoutSession').mockResolvedValueOnce({
      sessionId: 'cs_test_growth_123',
    });
    vi.spyOn(packageService, 'simulateWebhookPayment').mockResolvedValueOnce({
      received: true,
      activated: true,
    });

    renderWithProviders(<PackageSelectionPage />);

    await waitFor(() => {
      expect(screen.getByTestId('select-package-btn-starter')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-package-btn-starter'));

    await waitFor(() => {
      expect(packageService.createCheckoutSession).toHaveBeenCalledWith('starter', 'monthly');
    });
  });
});
