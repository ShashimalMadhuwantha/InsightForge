import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { DataSourcesListPage } from '../DataSourcesListPage';
import { dataSourceService } from '../../../services/dataSourceService';

const mockDataSources = [
  {
    id: 'ds-1',
    name: 'Q1 Global Sales',
    original_filename: 'sales_2026.xlsx',
    file_type: 'xlsx',
    status: 'ready',
    row_count: 1500,
    column_count: 8,
    current_version: 1,
    quality_metrics: { overall_score: 96 },
    created_at: new Date().toISOString(),
  },
  {
    id: 'ds-2',
    name: 'Customer Surveys',
    original_filename: 'surveys.csv',
    file_type: 'csv',
    status: 'processing',
    row_count: 0,
    column_count: 0,
    current_version: 1,
    quality_metrics: { overall_score: 0 },
    created_at: new Date().toISOString(),
  },
];

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('DataSourcesListPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders list of data sources with status badges and metrics', async () => {
    vi.spyOn(dataSourceService, 'listDataSources').mockResolvedValueOnce({
      dataSources: mockDataSources,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });

    renderWithRouter(<DataSourcesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Q1 Global Sales')).toBeInTheDocument();
      expect(screen.getByText('Customer Surveys')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-ready')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-processing')).toBeInTheDocument();
    });
  });

  it('renders empty state when tenant has no data sources', async () => {
    vi.spyOn(dataSourceService, 'listDataSources').mockResolvedValueOnce({
      dataSources: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });

    renderWithRouter(<DataSourcesListPage />);

    await waitFor(() => {
      expect(screen.getByText('No Data Sources Connected')).toBeInTheDocument();
      expect(screen.getByText('Upload First Dataset')).toBeInTheDocument();
    });
  });

  it('deletes data source when delete button is clicked and confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(dataSourceService, 'listDataSources')
      .mockResolvedValueOnce({
        dataSources: mockDataSources,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        dataSources: [mockDataSources[1]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    vi.spyOn(dataSourceService, 'deleteDataSource').mockResolvedValueOnce({ success: true });

    renderWithRouter(<DataSourcesListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-ds-ds-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-ds-ds-1'));

    await waitFor(() => {
      expect(dataSourceService.deleteDataSource).toHaveBeenCalledWith('ds-1');
    });
  });
});
