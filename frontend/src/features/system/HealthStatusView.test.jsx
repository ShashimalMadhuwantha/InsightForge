import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthStatusView } from './HealthStatusView';
import { apiClient } from '../../services/apiClient';

describe('HealthStatusView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and successful health status data', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      status: 'ok',
      environment: 'test',
      uptimeFormatted: '12m 34s',
      services: {
        db: 'healthy',
        redis: 'healthy',
      },
    });

    render(<HealthStatusView />);

    expect(screen.getByText(/System Health & Connectivity/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('global-status-banner')).toHaveTextContent(/All Infrastructure Systems Operational/i);
    });

    expect(screen.getByTestId('backend-status-badge')).toHaveTextContent(/Online/i);
    expect(screen.getByTestId('db-status-badge')).toHaveTextContent(/healthy/i);
    expect(screen.getByTestId('redis-status-badge')).toHaveTextContent(/healthy/i);
  });

  it('handles backend connection failure properly and displays error state', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network connection failed'));

    render(<HealthStatusView />);

    await waitFor(() => {
      expect(screen.getByTestId('global-status-banner')).toHaveTextContent(/Degraded System Performance/i);
    });

    expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument();
  });

  it('triggers refresh when refresh button is clicked', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      status: 'ok',
      environment: 'test',
      uptimeFormatted: '10s',
      services: {
        db: 'healthy',
        redis: 'healthy',
      },
    });

    render(<HealthStatusView />);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByTestId('refresh-btn');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });
});
