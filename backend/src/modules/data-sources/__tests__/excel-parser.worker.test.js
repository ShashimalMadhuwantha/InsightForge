const parserWorker = require('../data-sources.worker');

describe('DataSourceParserWorker Unit & Quality Engine Tests', () => {
  describe('inferType', () => {
    it('infers numeric type for integer and decimal numbers', () => {
      const type = parserWorker.inferType(['10', '25.5', '1,200', '42']);
      expect(type).toBe('numeric');
    });

    it('infers date type for valid date strings and timestamps', () => {
      const type = parserWorker.inferType(['2026-01-01', '2026-05-15', '2026-09-07']);
      expect(type).toBe('date');
    });

    it('infers boolean type for true/false and binary flags', () => {
      const type = parserWorker.inferType(['true', 'false', 'yes', 'no']);
      expect(type).toBe('boolean');
    });

    it('infers string type for mixed or textual values', () => {
      const type = parserWorker.inferType(['Acme Corp', 'Product Beta', 'Region East']);
      expect(type).toBe('string');
    });

    it('handles empty / all-null arrays gracefully as string', () => {
      const type = parserWorker.inferType([null, undefined, '']);
      expect(type).toBe('string');
    });
  });

  describe('analyzeQuality', () => {
    it('computes quality metrics accurately for clean data', () => {
      const rows = [
        { id: 1, name: 'Alpha', revenue: 100 },
        { id: 2, name: 'Beta', revenue: 200 },
        { id: 3, name: 'Gamma', revenue: 300 },
      ];

      const report = parserWorker.analyzeQuality(rows);
      expect(report.rowCount).toBe(3);
      expect(report.columnCount).toBe(3);
      expect(report.missingValuesCount).toBe(0);
      expect(report.duplicateRowsCount).toBe(0);
      expect(report.completenessPct).toBe(100);
      expect(report.overallScore).toBe(100);
      expect(report.schemaProfile.length).toBe(3);
    });

    it('detects missing values and duplicate rows and lowers quality score', () => {
      const rows = [
        { id: 1, name: 'Alpha', revenue: 100 },
        { id: 1, name: 'Alpha', revenue: 100 }, // Duplicate
        { id: 3, name: null, revenue: null },   // Missing values
      ];

      const report = parserWorker.analyzeQuality(rows);
      expect(report.rowCount).toBe(3);
      expect(report.duplicateRowsCount).toBe(1);
      expect(report.missingValuesCount).toBe(2);
      expect(report.overallScore).toBeLessThan(100);
    });

    it('handles empty row list gracefully', () => {
      const report = parserWorker.analyzeQuality([]);
      expect(report.rowCount).toBe(0);
      expect(report.overallScore).toBe(0);
    });
  });
});
