/**
 * CleansingEngine - Pure functional data transformation & outlier detection engine
 */
class CleansingEngine {
  /**
   * Helper to check if a value is null, undefined, or empty string
   */
  isNullOrEmpty(val) {
    return val === null || val === undefined || (typeof val === 'string' && val.trim() === '');
  }

  /**
   * 1. Remove duplicate rows (all columns or key column subset)
   */
  removeDuplicates(rows, options = {}) {
    const { subsetColumns = [] } = options;
    const seen = new Set();
    const result = [];
    let affectedCount = 0;

    for (const row of rows) {
      let key;
      if (subsetColumns && subsetColumns.length > 0) {
        const keyObj = {};
        for (const col of subsetColumns) {
          keyObj[col] = row[col];
        }
        key = JSON.stringify(keyObj);
      } else {
        key = JSON.stringify(row);
      }

      if (seen.has(key)) {
        affectedCount++;
      } else {
        seen.add(key);
        result.push({ ...row });
      }
    }

    return { rows: result, affectedCount };
  }

  /**
   * 2. Handle missing / null values (mean, median, mode, constant, forward_fill, drop_row)
   */
  handleMissing(rows, options = {}) {
    const { column, strategy = 'drop_row', fillValue = null } = options;
    if (!column) return { rows, affectedCount: 0 };

    let affectedCount = 0;

    if (strategy === 'drop_row') {
      const filtered = rows.filter((row) => {
        const isNull = this.isNullOrEmpty(row[column]);
        if (isNull) affectedCount++;
        return !isNull;
      });
      return { rows: filtered, affectedCount };
    }

    // Compute statistics for numeric/categorical imputation
    const validValues = rows
      .map((r) => r[column])
      .filter((v) => !this.isNullOrEmpty(v));

    let computedReplacement = fillValue;

    if (strategy === 'mean') {
      const numValues = validValues.map((v) => parseFloat(String(v).replace(/,/g, ''))).filter((n) => !isNaN(n));
      const sum = numValues.reduce((acc, n) => acc + n, 0);
      computedReplacement = numValues.length > 0 ? parseFloat((sum / numValues.length).toFixed(2)) : 0;
    } else if (strategy === 'median') {
      const numValues = validValues
        .map((v) => parseFloat(String(v).replace(/,/g, '')))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      if (numValues.length > 0) {
        const mid = Math.floor(numValues.length / 2);
        computedReplacement = numValues.length % 2 !== 0
          ? numValues[mid]
          : parseFloat(((numValues[mid - 1] + numValues[mid]) / 2).toFixed(2));
      } else {
        computedReplacement = 0;
      }
    } else if (strategy === 'mode') {
      const frequencyMap = {};
      let maxFreq = 0;
      let modeVal = validValues[0] || '';
      for (const v of validValues) {
        frequencyMap[v] = (frequencyMap[v] || 0) + 1;
        if (frequencyMap[v] > maxFreq) {
          maxFreq = frequencyMap[v];
          modeVal = v;
        }
      }
      computedReplacement = modeVal;
    }

    let lastKnownValue = validValues[0] ?? null;
    const result = rows.map((row) => {
      const val = row[column];
      if (this.isNullOrEmpty(val)) {
        affectedCount++;
        const newVal = strategy === 'forward_fill' ? lastKnownValue : computedReplacement;
        return { ...row, [column]: newVal };
      }
      lastKnownValue = val;
      return { ...row };
    });

    return { rows: result, affectedCount };
  }

  /**
   * 3. Drop rows with missing values across specified columns or all columns
   */
  dropMissing(rows, options = {}) {
    const { columns = [] } = options;
    let affectedCount = 0;

    const filtered = rows.filter((row) => {
      const targetCols = columns.length > 0 ? columns : Object.keys(row);
      const hasMissing = targetCols.some((col) => this.isNullOrEmpty(row[col]));
      if (hasMissing) {
        affectedCount++;
        return false;
      }
      return true;
    });

    return { rows: filtered, affectedCount };
  }

  /**
   * 4. Text standardization (trim, lower, upper, titlecase, regex_replace)
   */
  standardizeText(rows, options = {}) {
    const { column, operation = 'trim', pattern = '', replacement = '' } = options;
    if (!column) return { rows, affectedCount: 0 };

    let affectedCount = 0;
    const result = rows.map((row) => {
      const val = row[column];
      if (typeof val !== 'string') return { ...row };

      let updated = val;
      if (operation === 'trim') {
        updated = val.trim();
      } else if (operation === 'lowercase') {
        updated = val.toLowerCase().trim();
      } else if (operation === 'uppercase') {
        updated = val.toUpperCase().trim();
      } else if (operation === 'titlecase') {
        updated = val
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())
          .trim();
      } else if (operation === 'regex_replace' && pattern) {
        try {
          const regex = new RegExp(pattern, 'g');
          updated = val.replace(regex, replacement);
        } catch {
          updated = val;
        }
      }

      if (updated !== val) {
        affectedCount++;
      }
      return { ...row, [column]: updated };
    });

    return { rows: result, affectedCount };
  }

  /**
   * 5. Type casting (numeric, date, boolean, string)
   */
  castType(rows, options = {}) {
    const { column, targetType = 'numeric' } = options;
    if (!column) return { rows, affectedCount: 0 };

    let affectedCount = 0;
    const result = rows.map((row) => {
      const val = row[column];
      if (this.isNullOrEmpty(val)) return { ...row };

      let updated = val;
      if (targetType === 'numeric') {
        const cleanStr = String(val).replace(/[$€£,]/g, '').trim();
        const num = parseFloat(cleanStr);
        if (!isNaN(num) && isFinite(num)) {
          updated = num;
          if (updated !== val) affectedCount++;
        }
      } else if (targetType === 'boolean') {
        const str = String(val).toLowerCase().trim();
        if (['true', '1', 'yes', 'y'].includes(str)) {
          updated = true;
          if (updated !== val) affectedCount++;
        } else if (['false', '0', 'no', 'n'].includes(str)) {
          updated = false;
          if (updated !== val) affectedCount++;
        }
      } else if (targetType === 'date') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          updated = `${year}-${month}-${day}`;
          if (updated !== val) affectedCount++;
        }
      } else if (targetType === 'string') {
        updated = String(val);
        if (updated !== val) affectedCount++;
      }

      return { ...row, [column]: updated };
    });

    return { rows: result, affectedCount };
  }

  /**
   * 6. Drop specific column(s)
   */
  dropColumns(rows, options = {}) {
    const { columns = [] } = options;
    if (!columns || columns.length === 0) return { rows, affectedCount: 0 };

    const colSet = new Set(columns);
    const result = rows.map((row) => {
      const newRow = {};
      for (const [key, val] of Object.entries(row)) {
        if (!colSet.has(key)) {
          newRow[key] = val;
        }
      }
      return newRow;
    });

    return { rows: result, affectedCount: columns.length };
  }

  /**
   * 7. Rename columns
   */
  renameColumns(rows, options = {}) {
    const { columnMapping = {} } = options;
    const keysToRename = Object.keys(columnMapping);
    if (keysToRename.length === 0) return { rows, affectedCount: 0 };

    const result = rows.map((row) => {
      const newRow = {};
      for (const [key, val] of Object.entries(row)) {
        const newKey = columnMapping[key] || key;
        newRow[newKey] = val;
      }
      return newRow;
    });

    return { rows: result, affectedCount: keysToRename.length };
  }

  /**
   * 8. Filter rows based on conditional expression
   */
  filterRows(rows, options = {}) {
    const { column, operator = 'equals', value } = options;
    if (!column) return { rows, affectedCount: 0 };

    let affectedCount = 0;
    const result = rows.filter((row) => {
      const cellVal = row[column];
      let matches = false;

      const numCell = parseFloat(cellVal);
      const numTarget = parseFloat(value);
      const isBothNum = !isNaN(numCell) && !isNaN(numTarget);

      switch (operator) {
        case 'equals':
          matches = String(cellVal).toLowerCase() === String(value).toLowerCase();
          break;
        case 'not_equals':
          matches = String(cellVal).toLowerCase() !== String(value).toLowerCase();
          break;
        case 'greater_than':
          matches = isBothNum ? numCell > numTarget : String(cellVal) > String(value);
          break;
        case 'less_than':
          matches = isBothNum ? numCell < numTarget : String(cellVal) < String(value);
          break;
        case 'greater_than_or_equal':
          matches = isBothNum ? numCell >= numTarget : String(cellVal) >= String(value);
          break;
        case 'less_than_or_equal':
          matches = isBothNum ? numCell <= numTarget : String(cellVal) <= String(value);
          break;
        case 'contains':
          matches = String(cellVal).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'not_contains':
          matches = !String(cellVal).toLowerCase().includes(String(value).toLowerCase());
          break;
        default:
          matches = true;
      }

      if (!matches) {
        affectedCount++;
      }
      return matches;
    });

    return { rows: result, affectedCount };
  }

  /**
   * 9. Statistical Outlier Detection (Z-Score & IQR) [Task 5.2]
   */
  detectAndHandleOutliers(rows, options = {}) {
    const { column, method = 'iqr', threshold = 3.0, action = 'filter' } = options;
    if (!column || rows.length === 0) return { rows, affectedCount: 0, outliers: [] };

    // Extract valid numeric values
    const numericEntries = rows
      .map((r, index) => ({ index, val: parseFloat(String(r[column]).replace(/,/g, '')) }))
      .filter((item) => !isNaN(item.val) && isFinite(item.val));

    if (numericEntries.length < 4) {
      return { rows, affectedCount: 0, outliers: [] };
    }

    const values = numericEntries.map((item) => item.val).sort((a, b) => a - b);
    let isOutlierFn;
    let lowerBound = -Infinity;
    let upperBound = Infinity;

    if (method === 'zscore') {
      const n = values.length;
      const mean = values.reduce((sum, v) => sum + v, 0) / n;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1 || 1);
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) {
        return { rows, affectedCount: 0, outliers: [] };
      }

      const zThresh = threshold || 3.0;
      lowerBound = mean - zThresh * stdDev;
      upperBound = mean + zThresh * stdDev;
      isOutlierFn = (val) => Math.abs((val - mean) / stdDev) > zThresh;
    } else {
      // IQR method
      const q1Index = Math.floor(values.length * 0.25);
      const q3Index = Math.floor(values.length * 0.75);
      const q1 = values[q1Index];
      const q3 = values[q3Index];
      const iqr = q3 - q1;
      const multiplier = threshold || 1.5;
      lowerBound = q1 - multiplier * iqr;
      upperBound = q3 + multiplier * iqr;
      isOutlierFn = (val) => val < lowerBound || val > upperBound;
    }

    const outlierIndices = new Set();
    const outliers = [];

    for (const item of numericEntries) {
      if (isOutlierFn(item.val)) {
        outlierIndices.add(item.index);
        outliers.push({ index: item.index, value: item.val, lowerBound, upperBound });
      }
    }

    let affectedCount = outlierIndices.size;
    let result = [];

    if (action === 'filter') {
      result = rows.filter((_, idx) => !outlierIndices.has(idx));
    } else if (action === 'cap') {
      // Winsorizing (cap values to boundary)
      result = rows.map((row, idx) => {
        if (!outlierIndices.has(idx)) return { ...row };
        const originalVal = parseFloat(row[column]);
        let cappedVal = originalVal;
        if (originalVal < lowerBound) cappedVal = parseFloat(lowerBound.toFixed(2));
        if (originalVal > upperBound) cappedVal = parseFloat(upperBound.toFixed(2));
        return { ...row, [column]: cappedVal };
      });
    } else {
      result = rows.map((r) => ({ ...r }));
    }

    return {
      rows: result,
      affectedCount,
      outliers,
      lowerBound: parseFloat(lowerBound.toFixed(2)),
      upperBound: parseFloat(upperBound.toFixed(2)),
    };
  }

  /**
   * Apply full pipeline recipe sequentially
   */
  applyRecipe(rows, recipe = []) {
    let currentRows = rows.map((r) => ({ ...r }));
    const telemetry = [];

    for (let i = 0; i < recipe.length; i++) {
      const step = recipe[i];
      const initialCount = currentRows.length;
      let transformResult;

      switch (step.type) {
        case 'remove_duplicates':
          transformResult = this.removeDuplicates(currentRows, step.options);
          break;
        case 'handle_missing':
          transformResult = this.handleMissing(currentRows, step.options);
          break;
        case 'drop_missing':
          transformResult = this.dropMissing(currentRows, step.options);
          break;
        case 'text_standardization':
        case 'trim_spaces':
        case 'lowercase':
        case 'uppercase':
        case 'titlecase':
          transformResult = this.standardizeText(currentRows, {
            ...step.options,
            operation: step.type === 'text_standardization' ? (step.options?.operation || 'trim') : step.type,
          });
          break;
        case 'type_cast':
          transformResult = this.castType(currentRows, step.options);
          break;
        case 'drop_columns':
        case 'drop_column':
          transformResult = this.dropColumns(currentRows, step.options);
          break;
        case 'rename_columns':
        case 'rename_column':
          transformResult = this.renameColumns(currentRows, step.options);
          break;
        case 'filter_rows':
          transformResult = this.filterRows(currentRows, step.options);
          break;
        case 'outlier_detection':
          transformResult = this.detectAndHandleOutliers(currentRows, step.options);
          break;
        default:
          transformResult = { rows: currentRows, affectedCount: 0 };
      }

      currentRows = transformResult.rows;
      telemetry.push({
        stepIndex: i,
        type: step.type,
        options: step.options,
        rowsBefore: initialCount,
        rowsAfter: currentRows.length,
        rowsAffected: transformResult.affectedCount || 0,
        outliersDetected: transformResult.outliers?.length || 0,
      });
    }

    return {
      rows: currentRows,
      telemetry,
      finalRowCount: currentRows.length,
    };
  }
}

module.exports = new CleansingEngine();
