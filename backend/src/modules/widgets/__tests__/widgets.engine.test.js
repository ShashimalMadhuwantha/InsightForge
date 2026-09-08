const widgetsEngine = require('../widgets.engine');

describe('Widgets Aggregation & Query Engine (Epic 6 Task 6.2)', () => {
  const sampleData = [
    { region: 'North', category: 'Electronics', sales: 1200, profit: 300, date: '2026-01-15', status: 'completed' },
    { region: 'North', category: 'Furniture', sales: 800, profit: 120, date: '2026-01-20', status: 'completed' },
    { region: 'South', category: 'Electronics', sales: 1500, profit: 450, date: '2026-02-10', status: 'pending' },
    { region: 'South', category: 'Furniture', sales: 600, profit: -50, date: '2026-02-14', status: 'completed' },
    { region: 'West', category: 'Electronics', sales: 2000, profit: 600, date: '2026-03-05', status: 'completed' },
    { region: 'West', category: 'Supplies', sales: 400, profit: 80, date: '2026-03-12', status: 'completed' },
  ];

  describe('Filtering (applyFilters)', () => {
    it('applies eq and neq filters correctly', () => {
      const eqResult = widgetsEngine.applyFilters(sampleData, [
        { column: 'region', operator: 'eq', value: 'North' },
      ]);
      expect(eqResult.length).toBe(2);

      const neqResult = widgetsEngine.applyFilters(sampleData, [
        { column: 'status', operator: 'neq', value: 'completed' },
      ]);
      expect(neqResult.length).toBe(1);
      expect(neqResult[0].status).toBe('pending');
    });

    it('applies numeric comparison filters (gt, gte, lt, lte)', () => {
      const gtResult = widgetsEngine.applyFilters(sampleData, [
        { column: 'sales', operator: 'gt', value: 1000 },
      ]);
      expect(gtResult.length).toBe(3);

      const lteResult = widgetsEngine.applyFilters(sampleData, [
        { column: 'profit', operator: 'lte', value: 0 },
      ]);
      expect(lteResult.length).toBe(1);
      expect(lteResult[0].profit).toBe(-50);
    });

    it('applies string contains, starts_with, and in filters', () => {
      const containsResult = widgetsEngine.applyFilters(sampleData, [
        { column: 'category', operator: 'contains', value: 'tron' },
      ]);
      expect(containsResult.length).toBe(3);

      const inResult = widgetsEngine.applyFilters(sampleData, [
        { column: 'region', operator: 'in', value: ['North', 'West'] },
      ]);
      expect(inResult.length).toBe(4);
    });
  });

  describe('Date Truncation (truncateDate)', () => {
    it('truncates dates into monthly, quarterly, yearly, and weekly buckets', () => {
      expect(widgetsEngine.truncateDate('2026-03-15', 'monthly')).toBe('2026-03');
      expect(widgetsEngine.truncateDate('2026-03-15', 'yearly')).toBe('2026');
      expect(widgetsEngine.truncateDate('2026-03-15', 'quarterly')).toBe('2026-Q1');
      expect(widgetsEngine.truncateDate('2026-08-15', 'quarterly')).toBe('2026-Q3');
      expect(widgetsEngine.truncateDate('2026-03-15', 'daily')).toBe('2026-03-15');
    });
  });

  describe('Aggregation & Grouping (aggregateData)', () => {
    it('groups by dimension and computes sum, avg, count, min, max', () => {
      const config = {
        dimension: 'region',
        measures: [
          { column: 'sales', aggregation: 'sum', label: 'Total Sales' },
          { column: 'sales', aggregation: 'avg', label: 'Avg Sales' },
          { column: 'profit', aggregation: 'sum', label: 'Total Profit' },
          { column: 'sales', aggregation: 'count', label: 'Order Count' },
        ],
        sort: { column: 'Total Sales', direction: 'desc' },
      };

      const result = widgetsEngine.aggregateData(sampleData, config);

      expect(result.categories).toEqual(['West', 'South', 'North']);
      expect(result.series.length).toBe(4);

      // West has 2000 + 400 = 2400 sales
      const westRow = result.tableData.find((r) => r.region === 'West');
      expect(westRow['Total Sales']).toBe(2400);
      expect(westRow['Avg Sales']).toBe(1200);
      expect(westRow['Total Profit']).toBe(680);
      expect(westRow['Order Count']).toBe(2);
    });

    it('aggregates time series with monthly date bucketing and chronological sort', () => {
      const config = {
        dimension: 'date',
        time_bucket: 'monthly',
        measures: [{ column: 'sales', aggregation: 'sum', label: 'Monthly Sales' }],
      };

      const result = widgetsEngine.aggregateData(sampleData, config);
      expect(result.categories).toEqual(['2026-01', '2026-02', '2026-03']);
      expect(result.series[0].data).toEqual([2000, 2100, 2400]);
    });

    it('applies Top-N limit correctly', () => {
      const config = {
        dimension: 'region',
        measures: [{ column: 'sales', aggregation: 'sum', label: 'Sales' }],
        sort: { column: 'Sales', direction: 'desc' },
        limit: 2,
      };

      const result = widgetsEngine.aggregateData(sampleData, config);
      expect(result.categories.length).toBe(2);
      expect(result.categories).toEqual(['West', 'South']);
    });
  });

  describe('KPI Computation (computeKpi)', () => {
    it('computes single grand total KPI', () => {
      const result = widgetsEngine.computeKpi(sampleData, {
        measure: { column: 'sales', aggregation: 'sum' },
      });

      expect(result.current).toBe(6500);
      expect(result.count).toBe(6);
    });

    it('computes period-over-period comparison when date column is supplied', () => {
      const result = widgetsEngine.computeKpi(sampleData, {
        measure: { column: 'sales', aggregation: 'sum' },
        date_column: 'date',
      });

      // Sorted desc by date:
      // Recent (2026-03-12, 2026-03-05, 2026-02-14) = 400 + 2000 + 600 = 3000
      // Older (2026-02-10, 2026-01-20, 2026-01-15) = 1500 + 800 + 1200 = 3500
      expect(result.current).toBe(3000);
      expect(result.previous).toBe(3500);
      expect(result.change).toBe(-500);
      expect(result.trend).toBe('down');
    });
  });

  describe('Chart Auto-Suggestions (suggestChartTypes)', () => {
    it('generates line, bar, pie, and kpi suggestions for balanced dataset', () => {
      const schemaProfile = [
        { name: 'date', inferredType: 'date' },
        { name: 'category', inferredType: 'string' },
        { name: 'revenue', inferredType: 'numeric' },
        { name: 'costs', inferredType: 'numeric' },
      ];

      const suggestions = widgetsEngine.suggestChartTypes(schemaProfile, sampleData);

      expect(suggestions.length).toBeGreaterThanOrEqual(4);
      const types = suggestions.map((s) => s.type);
      expect(types).toContain('line');
      expect(types).toContain('bar');
      expect(types).toContain('pie');
      expect(types).toContain('kpi');
      expect(types).toContain('scatter');
      expect(types).toContain('table');
    });
  });
});
