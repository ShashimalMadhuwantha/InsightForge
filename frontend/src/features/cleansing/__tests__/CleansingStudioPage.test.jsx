import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CleansingStudioPage } from '../CleansingStudioPage';
import { dataSourceService } from '../../../services/dataSourceService';
import { cleansingService } from '../../../services/cleansingService';

describe('CleansingStudioPage Component (Tasks 5.6 & 5.7)', () => {
  const mockDataSource = {
    id: 'ds-123',
    name: 'Sales Telemetry 2026',
    current_version: 1,
    row_count: 100,
    column_count: 4,
    schema_profile: [
      { name: 'order_id', type: 'numeric' },
      { name: 'customer_name', type: 'string' },
      { name: 'revenue', type: 'numeric' },
      { name: 'region', type: 'string' },
    ],
    quality_metrics: {
      overall_score: 82,
      completeness_pct: 90,
      missing_values_count: 10,
      duplicate_rows_count: 5,
    },
  };

  const mockPreviewResponse = {
    before: {
      rowCount: 100,
      qualityScore: 82,
      missingCount: 10,
      sampleRows: [{ order_id: 1, customer_name: 'Acme Corp', revenue: 1200, region: 'East' }],
    },
    after: {
      rowCount: 95,
      qualityScore: 98,
      missingCount: 0,
      sampleRows: [{ order_id: 1, customer_name: 'Acme Corp', revenue: 1200, region: 'East' }],
    },
    telemetry: [{ type: 'remove_duplicates', rowsAffected: 5 }],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Cleansing Studio header, quality cards, and empty recipe prompt', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValueOnce(mockDataSource);
    vi.spyOn(cleansingService, 'previewCleansing').mockResolvedValueOnce(mockPreviewResponse);

    render(
      <MemoryRouter initialEntries={['/data-sources/ds-123/cleanse']}>
        <Routes>
          <Route path="/data-sources/:id/cleanse" element={<CleansingStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Data Cleansing Studio/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Target: Sales Telemetry 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/No Transformation Steps Yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Projected Quality Score/i)).toBeInTheDocument();
  });

  it('adds an operation from picker modal to the transformation recipe', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValueOnce(mockDataSource);
    vi.spyOn(cleansingService, 'previewCleansing').mockResolvedValue(mockPreviewResponse);

    render(
      <MemoryRouter initialEntries={['/data-sources/ds-123/cleanse']}>
        <Routes>
          <Route path="/data-sources/:id/cleanse" element={<CleansingStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-step-btn')).toBeInTheDocument();
    });

    // Open Picker Modal
    fireEvent.click(screen.getByTestId('add-step-btn'));
    expect(screen.getByRole('heading', { name: /Add Cleansing Operation/i })).toBeInTheDocument();

    // Select Remove Duplicates
    const opCard = screen.getByTestId('select-op-remove_duplicates');
    fireEvent.click(opCard);

    // Verify step added to pipeline
    await waitFor(() => {
      expect(screen.getByTestId('recipe-step-0')).toBeInTheDocument();
      expect(screen.getByText('Remove Duplicates')).toBeInTheDocument();
    });
  });

  it('submits cleansing recipe and triggers apply action', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValueOnce(mockDataSource);
    vi.spyOn(cleansingService, 'previewCleansing').mockResolvedValue(mockPreviewResponse);
    const applySpy = vi.spyOn(cleansingService, 'applyCleansing').mockResolvedValueOnce({
      success: true,
      version: 2,
      message: 'Dataset successfully cleansed and saved as Version 2',
    });

    render(
      <MemoryRouter initialEntries={['/data-sources/ds-123/cleanse']}>
        <Routes>
          <Route path="/data-sources/:id/cleanse" element={<CleansingStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    const addBtn = await screen.findByTestId('add-step-btn');
    fireEvent.click(addBtn);

    const opCard = await screen.findByTestId('select-op-remove_duplicates');
    fireEvent.click(opCard);

    await waitFor(() => {
      expect(screen.getByTestId('recipe-step-0')).toBeInTheDocument();
    });

    const applyBtn = screen.getByTestId('apply-cleansing-btn');
    await waitFor(() => {
      expect(applyBtn).not.toBeDisabled();
    });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('cleansing-success-alert')).toHaveTextContent(/Dataset successfully cleansed/i);
    });
  });

  it('displays LimitReachedModal when applying a locked operation returns 403 / FEATURE_NOT_INCLUDED', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValueOnce(mockDataSource);
    vi.spyOn(cleansingService, 'previewCleansing').mockResolvedValue(mockPreviewResponse);

    const lockError = new Error('Cleansing operation is locked on your tier');
    lockError.status = 403;
    lockError.response = {
      data: {
        code: 'FEATURE_NOT_INCLUDED',
        message: 'Cleansing operation is locked on your tier',
      },
    };

    vi.spyOn(cleansingService, 'applyCleansing').mockRejectedValueOnce(lockError);

    render(
      <MemoryRouter initialEntries={['/data-sources/ds-123/cleanse']}>
        <Routes>
          <Route path="/data-sources/:id/cleanse" element={<CleansingStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    const addBtn = await screen.findByTestId('add-step-btn');
    fireEvent.click(addBtn);

    const opCard = await screen.findByTestId('select-op-outlier_detection');
    fireEvent.click(opCard);

    await waitFor(() => {
      expect(screen.getByTestId('recipe-step-0')).toBeInTheDocument();
    });

    const applyBtn = screen.getByTestId('apply-cleansing-btn');
    await waitFor(() => {
      expect(applyBtn).not.toBeDisabled();
    });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByTestId('limit-reached-modal')).toBeInTheDocument();
      expect(screen.getByText(/Gated Data Cleansing Operation/i)).toBeInTheDocument();
    });
  });
});
