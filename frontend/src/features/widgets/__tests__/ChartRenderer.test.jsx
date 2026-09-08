import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartRenderer } from '../components/ChartRenderer';

describe('ChartRenderer Component (Epic 6 Task 6.5 & 6.6)', () => {
  const mockChartData = {
    queryResult: {
      categories: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: 'Revenue', data: [10000, 14000, 18000, 22000] },
      ],
      tableData: [
        { quarter: 'Q1', revenue: 10000 },
        { quarter: 'Q2', revenue: 14000 },
        { quarter: 'Q3', revenue: 18000 },
        { quarter: 'Q4', revenue: 22000 },
      ],
    },
  };

  it('renders Bar Chart with SVG elements and categories', () => {
    const { container } = render(
      <ChartRenderer
        type="bar"
        data={mockChartData}
        config={{ dimension: 'quarter', measure: { column: 'revenue' } }}
      />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q4')).toBeInTheDocument();
  });

  it('renders Line Chart with polyline/path curves', () => {
    const { container } = render(
      <ChartRenderer
        type="line"
        data={mockChartData}
        config={{ dimension: 'quarter', measure: { column: 'revenue' } }}
      />
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('renders Pie / Donut Chart with slice arcs', () => {
    const { container } = render(
      <ChartRenderer
        type="pie"
        data={mockChartData}
        config={{ dimension: 'quarter', measure: { column: 'revenue' } }}
      />
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4); // 4 quarters = 4 slices
  });

  it('renders KPI metric card with large tabular number and trend', () => {
    const kpiData = {
      queryResult: {
        current: 64000,
        previous: 50000,
        change: 14000,
        changePct: 28.0,
        trend: 'up',
      },
    };

    render(
      <ChartRenderer
        type="kpi"
        data={kpiData}
        config={{ measure: { column: 'revenue', label: 'Annual Revenue' } }}
      />
    );

    expect(screen.getByText('Annual Revenue')).toBeInTheDocument();
    expect(screen.getByText('64.0k')).toBeInTheDocument();
    expect(screen.getByText(/28/)).toBeInTheDocument();
  });

  it('renders Data Table with formatted numbers and column headers', () => {
    render(
      <ChartRenderer
        type="table"
        data={mockChartData}
        config={{ dimension: 'quarter', measure: { column: 'revenue' } }}
      />
    );

    expect(screen.getByText('quarter')).toBeInTheDocument();
    expect(screen.getByText('revenue')).toBeInTheDocument();
    expect(screen.getByText('10.0k')).toBeInTheDocument();
  });
});
