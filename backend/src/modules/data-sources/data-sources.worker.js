const fs = require('fs');
const xlsx = require('xlsx');
const { db } = require('../../common/config/db');

class DataSourceParserWorker {
  /**
   * Infer column data type based on sample non-null values
   */
  inferType(values) {
    if (!values || values.length === 0) return 'string';

    const nonNullValues = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    if (nonNullValues.length === 0) return 'string';

    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;

    for (const val of nonNullValues) {
      const str = String(val).trim();

      // Check Boolean
      if (/^(true|false|yes|no|1|0)$/i.test(str)) {
        booleanCount++;
      }

      // Check Numeric
      const cleanNum = str.replace(/,/g, '');
      if (!isNaN(cleanNum) && !isNaN(parseFloat(cleanNum)) && isFinite(cleanNum)) {
        numericCount++;
      }

      // Check Date (ISO, common date patterns, or Date object)
      if (val instanceof Date) {
        dateCount++;
      } else if (
        str.length >= 6 &&
        !/^\d+$/.test(str) && // Avoid pure numbers falsely parsed as timestamps
        !isNaN(Date.parse(str)) &&
        /[-/.]/.test(str)
      ) {
        dateCount++;
      }
    }

    const total = nonNullValues.length;
    if (numericCount / total >= 0.85) return 'numeric';
    if (dateCount / total >= 0.85) return 'date';
    if (booleanCount / total >= 0.90) return 'boolean';

    return 'string';
  }

  /**
   * Parse raw file buffer / disk file into structured rows and column headers
   */
  async parseRawFile(filePath, fileType) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);

    if (fileType === 'csv') {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, blankrows: false });
      return {
        sheets: ['Default'],
        selectedSheet: 'Default',
        rows,
      };
    }

    // Excel .xlsx or .xls
    const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheets = workbook.SheetNames || [];
    const selectedSheet = sheets[0] || 'Sheet1';
    const sheet = workbook.Sheets[selectedSheet];
    const rows = sheet ? xlsx.utils.sheet_to_json(sheet, { defval: null, blankrows: false }) : [];

    return {
      sheets,
      selectedSheet,
      rows,
    };
  }

  /**
   * Run comprehensive Data Quality Analysis on rows
   */
  analyzeQuality(rows) {
    if (!rows || rows.length === 0) {
      return {
        overallScore: 0,
        rowCount: 0,
        columnCount: 0,
        missingValuesCount: 0,
        duplicateRowsCount: 0,
        completenessPct: 0,
        schemaProfile: [],
      };
    }

    const rowCount = rows.length;
    // Extract unique headers across all rows
    const headersSet = new Set();
    rows.slice(0, 100).forEach((r) => Object.keys(r).forEach((k) => headersSet.add(k)));
    const headers = Array.from(headersSet);
    const columnCount = headers.length;

    let totalCells = rowCount * columnCount;
    let missingValuesCount = 0;

    // Detect duplicate rows using JSON string hash
    const rowHashes = new Set();
    let duplicateRowsCount = 0;

    const columnValuesMap = {};
    headers.forEach((h) => {
      columnValuesMap[h] = [];
    });

    for (const row of rows) {
      const rowStr = JSON.stringify(row);
      if (rowHashes.has(rowStr)) {
        duplicateRowsCount++;
      } else {
        rowHashes.add(rowStr);
      }

      for (const h of headers) {
        const val = row[h];
        if (val === null || val === undefined || String(val).trim() === '') {
          missingValuesCount++;
        } else {
          columnValuesMap[h].push(val);
        }
      }
    }

    // Build Schema Profile per column
    const schemaProfile = headers.map((header) => {
      const vals = columnValuesMap[header] || [];
      const nullCount = rowCount - vals.length;
      const inferredType = this.inferType(vals);
      const sampleValues = vals.slice(0, 5);

      return {
        name: header,
        type: inferredType,
        nullCount,
        nullPct: parseFloat(((nullCount / rowCount) * 100).toFixed(1)),
        sampleValues,
      };
    });

    const completenessPct = totalCells > 0
      ? parseFloat((((totalCells - missingValuesCount) / totalCells) * 100).toFixed(1))
      : 100;

    const uniquenessPct = rowCount > 0
      ? parseFloat((((rowCount - duplicateRowsCount) / rowCount) * 100).toFixed(1))
      : 100;

    // Weighted Overall Data Quality Score (0 - 100)
    const overallScore = Math.round(completenessPct * 0.6 + uniquenessPct * 0.4);

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      rowCount,
      columnCount,
      missingValuesCount,
      duplicateRowsCount,
      completenessPct,
      schemaProfile,
    };
  }

  /**
   * Process and profile a data source asynchronously
   */
  async processDataSource(dataSourceId, filePath, fileType) {
    try {
      await db('data_sources')
        .where('id', dataSourceId)
        .update({
          status: 'processing',
          updated_at: new Date(),
        });

      const { rows } = await this.parseRawFile(filePath, fileType);
      const quality = this.analyzeQuality(rows);

      await db('data_sources')
        .where('id', dataSourceId)
        .update({
          status: 'ready',
          row_count: quality.rowCount,
          column_count: quality.columnCount,
          schema_profile: JSON.stringify(quality.schemaProfile),
          quality_metrics: JSON.stringify({
            overall_score: quality.overallScore,
            missing_values_count: quality.missingValuesCount,
            duplicate_rows_count: quality.duplicateRowsCount,
            completeness_pct: quality.completenessPct,
          }),
          error_message: null,
          updated_at: new Date(),
        });

      return { success: true, quality };
    } catch (err) {
      await db('data_sources')
        .where('id', dataSourceId)
        .update({
          status: 'error',
          error_message: err.message || 'Failed to parse file structure',
          updated_at: new Date(),
        });
      throw err;
    }
  }
}

module.exports = new DataSourceParserWorker();
