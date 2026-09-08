const cleansingEngine = require('../cleansing.engine');

describe('CleansingEngine Unit Tests (Tasks 5.1 & 5.2)', () => {
  const sampleData = [
    { id: 1, name: '  Acme Corp  ', revenue: '1,200.50', status: 'ACTIVE', region: 'North', score: '85' },
    { id: 2, name: 'Beta Ltd', revenue: null, status: 'inactive', region: 'South', score: '90' },
    { id: 3, name: 'Gamma Inc', revenue: '3400', status: 'Active', region: 'North', score: '75' },
    { id: 1, name: '  Acme Corp  ', revenue: '1,200.50', status: 'ACTIVE', region: 'North', score: '85' }, // Duplicate
    { id: 4, name: 'Delta LLC', revenue: '50000', status: 'ACTIVE', region: 'West', score: '95' }, // Extreme outlier in revenue
  ];

  describe('1. Duplicate Removal', () => {
    it('removes duplicate rows across all columns', () => {
      const { rows, affectedCount } = cleansingEngine.removeDuplicates(sampleData);
      expect(rows.length).toBe(4);
      expect(affectedCount).toBe(1);
    });

    it('removes duplicate rows based on subset columns', () => {
      const { rows, affectedCount } = cleansingEngine.removeDuplicates(sampleData, { subsetColumns: ['id'] });
      expect(rows.length).toBe(4);
      expect(affectedCount).toBe(1);
    });
  });

  describe('2. Handle Missing Values', () => {
    it('drops rows with missing values on specific column', () => {
      const { rows, affectedCount } = cleansingEngine.handleMissing(sampleData, {
        column: 'revenue',
        strategy: 'drop_row',
      });
      expect(rows.length).toBe(4);
      expect(affectedCount).toBe(1);
    });

    it('imputes missing values with mean of numeric column', () => {
      const testRows = [
        { id: 1, revenue: 100 },
        { id: 2, revenue: 200 },
        { id: 3, revenue: null },
      ];
      const { rows, affectedCount } = cleansingEngine.handleMissing(testRows, {
        column: 'revenue',
        strategy: 'mean',
      });
      expect(rows[2].revenue).toBe(150);
      expect(affectedCount).toBe(1);
    });

    it('imputes missing values with median', () => {
      const testRows = [
        { id: 1, score: 10 },
        { id: 2, score: 20 },
        { id: 3, score: 100 },
        { id: 4, score: null },
      ];
      const { rows, affectedCount } = cleansingEngine.handleMissing(testRows, {
        column: 'score',
        strategy: 'median',
      });
      expect(rows[3].score).toBe(20);
      expect(affectedCount).toBe(1);
    });

    it('imputes missing values with constant value', () => {
      const { rows, affectedCount } = cleansingEngine.handleMissing(sampleData, {
        column: 'revenue',
        strategy: 'constant',
        fillValue: '0',
      });
      expect(rows[1].revenue).toBe('0');
      expect(affectedCount).toBe(1);
    });
  });

  describe('3. Text Standardization', () => {
    it('trims leading and trailing whitespace', () => {
      const { rows, affectedCount } = cleansingEngine.standardizeText(sampleData, {
        column: 'name',
        operation: 'trim',
      });
      expect(rows[0].name).toBe('Acme Corp');
      expect(affectedCount).toBe(2);
    });

    it('converts text to lowercase', () => {
      const { rows } = cleansingEngine.standardizeText(sampleData, {
        column: 'status',
        operation: 'lowercase',
      });
      expect(rows[0].status).toBe('active');
    });

    it('converts text to titlecase', () => {
      const { rows } = cleansingEngine.standardizeText(sampleData, {
        column: 'status',
        operation: 'titlecase',
      });
      expect(rows[1].status).toBe('Inactive');
    });

    it('replaces text with regex pattern', () => {
      const { rows } = cleansingEngine.standardizeText(sampleData, {
        column: 'region',
        operation: 'regex_replace',
        pattern: 'North',
        replacement: 'Northeast',
      });
      expect(rows[0].region).toBe('Northeast');
    });
  });

  describe('4. Type Casting', () => {
    it('casts currency/formatted string to numeric float', () => {
      const { rows } = cleansingEngine.castType(sampleData, {
        column: 'revenue',
        targetType: 'numeric',
      });
      expect(rows[0].revenue).toBe(1200.5);
    });

    it('casts string to boolean', () => {
      const testRows = [{ flag: 'true' }, { flag: '0' }, { flag: 'yes' }, { flag: 'no' }];
      const { rows } = cleansingEngine.castType(testRows, {
        column: 'flag',
        targetType: 'boolean',
      });
      expect(rows[0].flag).toBe(true);
      expect(rows[1].flag).toBe(false);
      expect(rows[2].flag).toBe(true);
      expect(rows[3].flag).toBe(false);
    });

    it('casts string date to standard ISO format', () => {
      const testRows = [{ date: '2026/08/15' }];
      const { rows } = cleansingEngine.castType(testRows, {
        column: 'date',
        targetType: 'date',
      });
      expect(rows[0].date).toBe('2026-08-15');
    });
  });

  describe('5. Column & Row Operations', () => {
    it('drops columns', () => {
      const { rows } = cleansingEngine.dropColumns(sampleData, { columns: ['status', 'score'] });
      expect(rows[0].status).toBeUndefined();
      expect(rows[0].score).toBeUndefined();
      expect(rows[0].name).toBeDefined();
    });

    it('renames columns', () => {
      const { rows } = cleansingEngine.renameColumns(sampleData, {
        columnMapping: { name: 'company_name', revenue: 'total_revenue' },
      });
      expect(rows[0].company_name).toBeDefined();
      expect(rows[0].total_revenue).toBeDefined();
      expect(rows[0].name).toBeUndefined();
    });

    it('filters rows based on numeric condition', () => {
      const { rows } = cleansingEngine.filterRows(sampleData, {
        column: 'score',
        operator: 'greater_than',
        value: 80,
      });
      expect(rows.length).toBe(4);
    });
  });

  describe('6. Statistical Outlier Detection (Task 5.2)', () => {
    const distribution = [
      { val: 10 },
      { val: 12 },
      { val: 11 },
      { val: 13 },
      { val: 10 },
      { val: 12 },
      { val: 11 },
      { val: 999 }, // Extreme outlier
    ];

    it('detects and filters outliers using IQR method', () => {
      const { rows, affectedCount, outliers } = cleansingEngine.detectAndHandleOutliers(distribution, {
        column: 'val',
        method: 'iqr',
        threshold: 1.5,
        action: 'filter',
      });
      expect(affectedCount).toBe(1);
      expect(outliers.length).toBe(1);
      expect(rows.length).toBe(7);
      expect(rows.some((r) => r.val === 999)).toBe(false);
    });

    it('detects and caps outliers (winsorizing) using Z-Score', () => {
      const { rows, affectedCount, upperBound } = cleansingEngine.detectAndHandleOutliers(distribution, {
        column: 'val',
        method: 'zscore',
        threshold: 2.0,
        action: 'cap',
      });
      expect(affectedCount).toBe(1);
      expect(rows.length).toBe(8);
      expect(rows[7].val).toBeLessThan(999);
      expect(rows[7].val).toBe(upperBound);
    });
  });

  describe('7. Full Recipe Execution Pipeline', () => {
    it('executes a sequence of operations correctly', () => {
      const recipe = [
        { type: 'remove_duplicates' },
        { type: 'text_standardization', options: { column: 'name', operation: 'trim' } },
        { type: 'handle_missing', options: { column: 'revenue', strategy: 'constant', fillValue: '0' } },
        { type: 'type_cast', options: { column: 'revenue', targetType: 'numeric' } },
      ];

      const { rows, telemetry } = cleansingEngine.applyRecipe(sampleData, recipe);
      expect(rows.length).toBe(4);
      expect(telemetry.length).toBe(4);
      expect(rows[0].name).toBe('Acme Corp');
      expect(rows[1].revenue).toBe(0);
      expect(typeof rows[0].revenue).toBe('number');
    });
  });
});
