import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChartBuilderPage } from '../ChartBuilderPage';
import { dataSourceService } from '../../../services/dataSourceService';
import { widgetService } from '../../../services/widgetService';

describe('ChartBuilderPage Component (Epic 6 Tasks 6.4 to 6.7)', () => {
  const mockDataSources = [
    {
      id: 'ds-101',
      name: 'Regional Q1 Sales',
      current_version: 1,
      row_count: 500,
    },
  ];

  const mockDataSourceDetails = {
    id: 'ds-101',
    name: 'Regional Q1 Sales',
    current_version: 1,
    row_count: 500,
    schema_profile: [
      { name: 'region', inferredType: 'string' },
      { name: 'revenue', inferredType: 'numeric' },
      { name: 'date', inferredType: 'date' },
    ],
  };

  const mockSuggestions = [
    {
      type: 'line',
      title: 'Revenue Trend',
      isLocked: false,
      config: { dimension: 'date', time_bucket: 'monthly', measures: [{ column: 'revenue', aggregation: 'sum' }] },
    },
    {
      type: 'scatter',
      title: 'Revenue Scatter',
      isLocked: true,
      config: { dimension: 'revenue', measures: [{ column: 'revenue', aggregation: 'avg' }] },
    },
  ];

  const mockQueryResult = {
    widgetType: 'bar',
    executionTimeMs: 14,
    queryResult: {
      categories: ['North', 'South', 'West'],
      series: [{ name: 'Total revenue', data: [12000, 15000, 18000] }],
      tableData: [
        { region: 'North', revenue: 12000 },
        { region: 'South', revenue: 15000 },
        { region: 'West', revenue: 18000 },
      ],
      summary: { totalRows: 500, filteredRows: 500, groupCount: 3 },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Chart Builder studio, dataset selector, and chart types', async () => {
    vi.spyOn(dataSourceService, 'listDataSources').mockResolvedValue({ dataSources: mockDataSources });
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValue(mockDataSourceDetails);
    vi.spyOn(widgetService, 'getSuggestions').mockResolvedValue({ data: { suggestions: mockSuggestions } });
    vi.spyOn(widgetService, 'queryWidgetData').mockResolvedValue({ data: mockQueryResult });

    render(
      <MemoryRouter initialEntries={['/widgets/new?dataSourceId=ds-101']}>
        <Routes>
          <Route path="/widgets/new" element={<ChartBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Widget Title...')).toBeInTheDocument();
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
      expect(screen.getByText('Smart Suggestions:')).toBeInTheDocument();
    });
  });

  it('displays LimitReachedModal when clicking on a locked chart type', async () => {
    vi.spyOn(dataSourceService, 'listDataSources').mockResolvedValue({ dataSources: mockDataSources });
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValue(mockDataSourceDetails);
    vi.spyOn(widgetService, 'getSuggestions').mockResolvedValue({ data: { suggestions: mockSuggestions } });
    vi.spyOn(widgetService, 'queryWidgetData').mockResolvedValue({ data: mockQueryResult });

    render(
      <MemoryRouter initialEntries={['/widgets/new?dataSourceId=ds-101']}>
        <Routes>
          <Route path="/widgets/new" element={<ChartBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Revenue Scatter')).toBeInTheDocument();
    });

    // Click locked suggestion
    fireEvent.click(screen.getByText('Revenue Scatter'));

    await waitFor(() => {
      expect(screen.getByTestId('limit-reached-modal')).toBeInTheDocument();
      expect(screen.getByText(/Premium Visualization Widget/i)).toBeInTheDocument();
    });
  });

  it('applies smart suggestion to state and updates chart title', async () => {
    vi.spyOn(dataSourceService, 'listDataSources').mockResolvedValue({ dataSources: mockDataSources });
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValue(mockDataSourceDetails);
    vi.spyOn(widgetService, 'getSuggestions').mockResolvedValue({ data: { suggestions: mockSuggestions } });
    vi.spyOn(widgetService, 'queryWidgetData').mockResolvedValue({ data: mockQueryResult });

    render(
      <MemoryRouter initialEntries={['/widgets/new?dataSourceId=ds-101']}>
        <Routes>
          <Route path="/widgets/new" element={<ChartBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Revenue Trend'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Revenue Trend')).toBeInTheDocument();
    });
  });

  it('saves widget successfully and calls widgetService.createWidget', async () => {
    vi.spyOn(dataSourceService, 'listDataSources').mockResolvedValue({ dataSources: mockDataSources });
    vi.spyOn(dataSourceService, 'getDataSourceById').mockResolvedValue(mockDataSourceDetails);
    vi.spyOn(widgetService, 'getSuggestions').mockResolvedValue({ data: { suggestions: mockSuggestions } });
    vi.spyOn(widgetService, 'queryWidgetData').mockResolvedValue({ data: mockQueryResult });
    const createSpy = vi.spyOn(widgetService, 'createWidget').mockResolvedValueOnce({ data: { id: 'w-new' } });

    render(
      <MemoryRouter initialEntries={['/widgets/new?dataSourceId=ds-101']}>
        <Routes>
          <Route path="/widgets/new" element={<ChartBuilderPage />} />
          <Route path="/widgets" element={<div>Widgets Gallery View</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Save Widget')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Widget'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bar',
          data_source_id: 'ds-101',
        })
      );
    });
  });
});
