import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { DataStatusView } from '../DataStatusView';
import { dataSourceService } from '../../../services/dataSourceService';

const mockDataSourceDetail = {
  id: 'ds-1',
  name: 'Global Orders Dataset',
  original_filename: 'orders.xlsx',
  file_type: 'xlsx',
  status: 'ready',
  row_count: 5000,
  column_count: 4,
  current_version: 1,
  quality_metrics: {
    overall_score: 92,
    completeness_pct: 98.5,
    missing_values_count: 15,
    duplicate_rows_count: 2,
  },
  schema_profile: [
    { name: 'order_id', type: 'numeric', nullCount: 0, nullPct: 0, sampleValues: [1001, 1002] },
    { name: 'order_date', type: 'date', nullCount: 0, nullPct: 0, sampleValues: ['2026-01-01'] },
    { name: 'customer_name', type: 'string', nullCount: 5, nullPct: 0.1, sampleValues: ['Acme Inc'] },
    { name: 'is_active', type: 'boolean', nullCount: 0, nullPct: 0, sampleValues: [true] },
  ],
  versions: [
    { id: 'v-1', version_number: 1, file_size_bytes: 2048000, row_count: 5000, created_at: new Date().toISOString() },
  ],
};

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('DataStatusView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders data quality score and metric cards', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValueOnce(mockDataSourceDetail);

    renderWithRouter(<DataStatusView />);

    await waitFor(() => {
      expect(screen.getByTestId('quality-score-card')).toBeInTheDocument();
      expect(screen.getByText('Global Orders Dataset')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });
  });

  it('renders schema profile table with inferred data types', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValueOnce(mockDataSourceDetail);

    renderWithRouter(<DataStatusView />);

    await waitFor(() => {
      expect(screen.getByText('order_id')).toBeInTheDocument();
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Boolean')).toBeInTheDocument();
      expect(screen.getByText('String')).toBeInTheDocument();
    });
  });

  it('switches to sample preview tab and version history tab', async () => {
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValue(mockDataSourceDetail);
    vi.spyOn(dataSourceService, 'getDataSourcePreview').mockResolvedValueOnce({
      totalRows: 5000,
      sampleRows: [
        { order_id: 1001, customer_name: 'Acme Corp' },
      ],
      columns: [],
    });

    renderWithRouter(<DataStatusView />);

    await waitFor(() => {
      expect(screen.getByTestId('preview-tab-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('preview-tab-btn'));

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('versions-tab-btn'));

    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });
  });
});
