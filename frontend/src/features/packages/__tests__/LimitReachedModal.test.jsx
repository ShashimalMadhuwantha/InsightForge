import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LimitReachedModal } from '../LimitReachedModal';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('LimitReachedModal Component', () => {
  it('does not render when isOpen is false', () => {
    renderWithRouter(
      <LimitReachedModal
        isOpen={false}
        onClose={vi.fn()}
        limitType="data_sources"
        currentUsage={2}
        maxLimit={2}
      />
    );

    expect(screen.queryByTestId('limit-reached-modal')).not.toBeInTheDocument();
  });

  it('renders limit information for data sources when open', () => {
    const handleClose = vi.fn();
    renderWithRouter(
      <LimitReachedModal
        isOpen={true}
        onClose={handleClose}
        limitType="data_sources"
        currentUsage={2}
        maxLimit={2}
      />
    );

    expect(screen.getByTestId('limit-reached-modal')).toBeInTheDocument();
    expect(screen.getByText('Data Sources Limit Reached')).toBeInTheDocument();
    expect(screen.getByText(/You have connected 2 of 2 allowable data sources/i)).toBeInTheDocument();
    expect(screen.getByText('Unlock with Plan Upgrade:')).toBeInTheDocument();
  });

  it('renders specific details for cleansing op limit', () => {
    renderWithRouter(
      <LimitReachedModal
        isOpen={true}
        onClose={vi.fn()}
        limitType="cleansing_op"
        featureName="remove_outliers"
        requiredTier="Growth Business"
      />
    );

    expect(screen.getByText('Gated Data Cleansing Operation')).toBeInTheDocument();
    expect(screen.getByText(/remove_outliers.*Growth Business/i)).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', () => {
    const handleClose = vi.fn();
    renderWithRouter(
      <LimitReachedModal
        isOpen={true}
        onClose={handleClose}
        limitType="sub_users"
        currentUsage={1}
        maxLimit={1}
      />
    );

    fireEvent.click(screen.getByTestId('dismiss-limit-modal-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
