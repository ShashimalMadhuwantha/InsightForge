/**
 * Pure Functional Analytics & Aggregation Engine for BI Widgets (Epic 6 Task 6.2)
 *
 * Provides in-memory query processing on dataset rows:
 * - Filtering (WHERE predicates: eq, neq, gt, gte, lt, lte, contains, in, between)
 * - Grouping & Dimension aggregation (GROUP BY single/multiple columns)
 * - Time-bucket date truncation (daily, weekly, monthly, quarterly, yearly)
 * - Metrics: SUM, AVG, COUNT, COUNT_DISTINCT, MIN, MAX
 * - Post-aggregation filtering (HAVING)
 * - Sorting & Top-N truncation
 * - Smart chart suggestion engine based on column schema analysis
 */

class WidgetsEngine {
  /**
   * Filter rows based on a list of predicate clauses
   */
  applyFilters(rows = [], filters = []) {
    if (!filters || filters.length === 0) return rows;

    return rows.filter((row) => {
      return filters.every((filter) => {
        const { column, operator, value } = filter;
        if (!column) return true;

        const cellValue = row[column];

        switch (operator) {
          case 'eq':
            return String(cellValue ?? '').toLowerCase() === String(value ?? '').toLowerCase();

          case 'neq':
            return String(cellValue ?? '').toLowerCase() !== String(value ?? '').toLowerCase();

          case 'gt': {
            const num = parseFloat(cellValue);
            const target = parseFloat(value);
            return !isNaN(num) && !isNaN(target) && num > target;
          }

          case 'gte': {
            const num = parseFloat(cellValue);
            const target = parseFloat(value);
            return !isNaN(num) && !isNaN(target) && num >= target;
          }

          case 'lt': {
            const num = parseFloat(cellValue);
            const target = parseFloat(value);
            return !isNaN(num) && !isNaN(target) && num < target;
          }

          case 'lte': {
            const num = parseFloat(cellValue);
            const target = parseFloat(value);
            return !isNaN(num) && !isNaN(target) && num <= target;
          }

          case 'contains':
            return String(cellValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());

          case 'starts_with':
            return String(cellValue ?? '').toLowerCase().startsWith(String(value ?? '').toLowerCase());

          case 'in':
            if (Array.isArray(value)) {
              return value.map((v) => String(v).toLowerCase()).includes(String(cellValue ?? '').toLowerCase());
            }
            return false;

          case 'not_in':
            if (Array.isArray(value)) {
              return !value.map((v) => String(v).toLowerCase()).includes(String(cellValue ?? '').toLowerCase());
            }
            return true;

          case 'is_null':
            return cellValue === null || cellValue === undefined || cellValue === '';

          case 'not_null':
            return cellValue !== null && cellValue !== undefined && cellValue !== '';

          case 'between': {
            if (Array.isArray(value) && value.length === 2) {
              const num = parseFloat(cellValue);
              const [min, max] = [parseFloat(value[0]), parseFloat(value[1])];
              if (!isNaN(num) && !isNaN(min) && !isNaN(max)) {
                return num >= min && num <= max;
              }
              // Try date comparison
              const d = new Date(cellValue).getTime();
              const d1 = new Date(value[0]).getTime();
              const d2 = new Date(value[1]).getTime();
              if (!isNaN(d) && !isNaN(d1) && !isNaN(d2)) {
                return d >= d1 && d <= d2;
              }
            }
            return true;
          }

          default:
            return true;
        }
      });
    });
  }

  /**
   * Truncate date values into uniform time buckets (daily, weekly, monthly, quarterly, yearly)
   */
  truncateDate(val, bucket = 'none') {
    if (!val || bucket === 'none') return String(val ?? '');

    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');

    switch (bucket) {
      case 'daily':
        return `${year}-${month}-${day}`;

      case 'weekly': {
        // Calculate ISO week date (Monday of the week)
        const dateCopy = new Date(d);
        const dayOfWeek = (dateCopy.getUTCDay() + 6) % 7; // 0 = Monday, 6 = Sunday
        dateCopy.setUTCDate(dateCopy.getUTCDate() - dayOfWeek);
        const wYear = dateCopy.getUTCFullYear();
        const wMonth = String(dateCopy.getUTCMonth() + 1).padStart(2, '0');
        const wDay = String(dateCopy.getUTCDate()).padStart(2, '0');
        return `${wYear}-${wMonth}-${wDay}`;
      }

      case 'monthly':
        return `${year}-${month}`;

      case 'quarterly': {
        const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
        return `${year}-Q${quarter}`;
      }

      case 'yearly':
        return `${year}`;

      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Calculate single aggregated metric for a list of values
   */
  calculateMetric(values = [], aggregation = 'sum') {
    const validNumbers = values
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v) && isFinite(v));

    switch (aggregation.toLowerCase()) {
      case 'sum': {
        const sum = validNumbers.reduce((acc, v) => acc + v, 0);
        return parseFloat(sum.toFixed(4));
      }

      case 'avg': {
        if (validNumbers.length === 0) return 0;
        const avg = validNumbers.reduce((acc, v) => acc + v, 0) / validNumbers.length;
        return parseFloat(avg.toFixed(4));
      }

      case 'count':
        return values.filter((v) => v !== null && v !== undefined && v !== '').length;

      case 'count_distinct': {
        const unique = new Set(values.map((v) => String(v)));
        return unique.size;
      }

      case 'min': {
        if (validNumbers.length === 0) return 0;
        return Math.min(...validNumbers);
      }

      case 'max': {
        if (validNumbers.length === 0) return 0;
        return Math.max(...validNumbers);
      }

      default:
        return validNumbers.reduce((acc, v) => acc + v, 0);
    }
  }

  /**
   * Main dataset aggregation pipeline (GROUP BY, measures, sorting, top-N, time buckets)
   */
  aggregateData(rows = [], config = {}) {
    const {
      dimension = null,
      time_bucket = 'none',
      measures = [{ column: '', aggregation: 'count', label: 'Count' }],
      filters = [],
      sort = null,
      limit = null,
      having = [],
    } = config;

    // 1. Apply WHERE filters
    const filteredRows = this.applyFilters(rows, filters);

    // If no dimension specified (e.g. grand total / single summary)
    if (!dimension) {
      const singleRow = {};
      measures.forEach((m, idx) => {
        const label = m.label || `${m.aggregation}_${m.column || idx}`;
        const vals = filteredRows.map((r) => r[m.column]);
        singleRow[label] = this.calculateMetric(vals, m.aggregation);
      });

      return {
        categories: ['Total'],
        series: measures.map((m, idx) => {
          const label = m.label || `${m.aggregation}_${m.column || idx}`;
          return {
            name: label,
            column: m.column,
            aggregation: m.aggregation,
            data: [singleRow[label]],
          };
        }),
        tableData: [singleRow],
        summary: {
          totalRows: rows.length,
          filteredRows: filteredRows.length,
          groupCount: 1,
        },
      };
    }

    // 2. Group rows by dimension (with optional time-bucket truncation)
    const groups = new Map(); // key -> array of rows

    filteredRows.forEach((row) => {
      let rawDimVal = row[dimension];
      if (rawDimVal === null || rawDimVal === undefined || rawDimVal === '') {
        rawDimVal = '(Empty)';
      }

      const dimKey = time_bucket && time_bucket !== 'none'
        ? this.truncateDate(rawDimVal, time_bucket)
        : String(rawDimVal);

      if (!groups.has(dimKey)) {
        groups.set(dimKey, []);
      }
      groups.get(dimKey).push(row);
    });

    // 3. Compute aggregations per group
    let aggregatedTable = [];

    groups.forEach((groupRows, dimKey) => {
      const tableRow = { [dimension]: dimKey };

      measures.forEach((m, idx) => {
        const label = m.label || `${m.aggregation}_${m.column || idx}`;
        const vals = groupRows.map((r) => r[m.column]);
        tableRow[label] = this.calculateMetric(vals, m.aggregation);
      });

      aggregatedTable.push(tableRow);
    });

    // 4. Apply post-aggregation HAVING filters
    if (having && having.length > 0) {
      aggregatedTable = this.applyFilters(aggregatedTable, having);
    }

    // 5. Apply Sorting
    if (sort && sort.column) {
      const { column: sortCol, direction = 'asc' } = sort;
      const isDesc = direction.toLowerCase() === 'desc';

      aggregatedTable.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return isDesc ? numB - numA : numA - numB;
        }

        const strA = String(valA ?? '');
        const strB = String(valB ?? '');
        return isDesc ? strB.localeCompare(strA) : strA.localeCompare(strB);
      });
    } else {
      // Default: If time bucketed, sort chronologically by dimension
      if (time_bucket && time_bucket !== 'none') {
        aggregatedTable.sort((a, b) => String(a[dimension]).localeCompare(String(b[dimension])));
      }
    }

    // 6. Apply Limit (Top-N)
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      aggregatedTable = aggregatedTable.slice(0, parsedLimit);
    }

    // 7. Format into Chart-ready Series and Categories
    const categories = aggregatedTable.map((r) => r[dimension]);

    const series = measures.map((m, idx) => {
      const label = m.label || `${m.aggregation}_${m.column || idx}`;
      return {
        name: label,
        column: m.column,
        aggregation: m.aggregation,
        data: aggregatedTable.map((r) => r[label] ?? 0),
      };
    });

    // Calculate overall summaries
    const totals = {};
    measures.forEach((m, idx) => {
      const label = m.label || `${m.aggregation}_${m.column || idx}`;
      const allVals = series[idx].data;
      totals[label] = {
        sum: this.calculateMetric(allVals, 'sum'),
        avg: this.calculateMetric(allVals, 'avg'),
        min: this.calculateMetric(allVals, 'min'),
        max: this.calculateMetric(allVals, 'max'),
      };
    });

    return {
      categories,
      series,
      tableData: aggregatedTable,
      summary: {
        totalRows: rows.length,
        filteredRows: filteredRows.length,
        groupCount: categories.length,
        totals,
      },
    };
  }

  /**
   * Compute single KPI metric with optional historical comparison (Task 6.2 & 6.5)
   */
  computeKpi(rows = [], config = {}) {
    const {
      measure = { column: '', aggregation: 'sum', label: 'Metric' },
      date_column = null,
      filters = [],
    } = config;

    const filteredRows = this.applyFilters(rows, filters);
    const colName = measure.column;
    const agg = measure.aggregation || 'sum';

    if (!date_column || filteredRows.length < 2) {
      const vals = filteredRows.map((r) => r[colName]);
      const current = this.calculateMetric(vals, agg);
      return {
        current,
        previous: null,
        change: 0,
        changePct: 0,
        trend: 'neutral',
        count: filteredRows.length,
      };
    }

    // Sort by date descending to split into current vs previous periods
    const sorted = [...filteredRows].sort((a, b) => {
      const dA = new Date(a[date_column]).getTime() || 0;
      const dB = new Date(b[date_column]).getTime() || 0;
      return dB - dA;
    });

    const midIndex = Math.floor(sorted.length / 2);
    const currentPeriodRows = sorted.slice(0, midIndex);
    const prevPeriodRows = sorted.slice(midIndex);

    const current = this.calculateMetric(currentPeriodRows.map((r) => r[colName]), agg);
    const previous = this.calculateMetric(prevPeriodRows.map((r) => r[colName]), agg);

    const change = parseFloat((current - previous).toFixed(4));
    const changePct = previous !== 0
      ? parseFloat(((change / Math.abs(previous)) * 100).toFixed(2))
      : 0;

    let trend = 'neutral';
    if (change > 0) trend = 'up';
    else if (change < 0) trend = 'down';

    return {
      current,
      previous,
      change,
      changePct,
      trend,
      count: filteredRows.length,
    };
  }

  /**
   * Auto-suggest chart types based on dataset column schema and distributions (Task 6.2)
   */
  suggestChartTypes(schemaProfile = [], _sampleRows = []) {
    const suggestions = [];

    if (!Array.isArray(schemaProfile) || schemaProfile.length === 0) {
      return suggestions;
    }

    const dateCols = schemaProfile.filter((col) => col.inferredType === 'date' || col.dataType === 'date');
    const numericCols = schemaProfile.filter((col) => col.inferredType === 'numeric' || col.dataType === 'numeric' || col.inferredType === 'number');
    const categoricalCols = schemaProfile.filter(
      (col) =>
        (col.inferredType === 'string' || col.dataType === 'string') &&
        col.name.toLowerCase() !== 'id'
    );

    // 1. Date + Numeric -> Line or Area Chart (Time Series Trend)
    if (dateCols.length > 0 && numericCols.length > 0) {
      suggestions.push({
        type: 'line',
        title: `${numericCols[0].name} Trend over Time`,
        description: `Visualizes changes in ${numericCols[0].name} across ${dateCols[0].name}.`,
        confidence: 0.95,
        config: {
          dimension: dateCols[0].name,
          time_bucket: 'monthly',
          measures: [{ column: numericCols[0].name, aggregation: 'sum', label: `Total ${numericCols[0].name}` }],
          sort: { column: dateCols[0].name, direction: 'asc' },
          limit: 50,
        },
      });

      suggestions.push({
        type: 'area',
        title: `${numericCols[0].name} Cumulative Volume`,
        description: `Displays cumulative volume of ${numericCols[0].name} over ${dateCols[0].name}.`,
        confidence: 0.85,
        config: {
          dimension: dateCols[0].name,
          time_bucket: 'monthly',
          measures: [{ column: numericCols[0].name, aggregation: 'sum', label: `Sum of ${numericCols[0].name}` }],
          sort: { column: dateCols[0].name, direction: 'asc' },
          limit: 50,
        },
      });
    }

    // 2. Categorical + Numeric -> Bar Chart (Category Comparison)
    if (categoricalCols.length > 0 && numericCols.length > 0) {
      suggestions.push({
        type: 'bar',
        title: `${numericCols[0].name} by ${categoricalCols[0].name}`,
        description: `Compares ${numericCols[0].name} totals across categories of ${categoricalCols[0].name}.`,
        confidence: 0.92,
        config: {
          dimension: categoricalCols[0].name,
          time_bucket: 'none',
          measures: [{ column: numericCols[0].name, aggregation: 'sum', label: `Total ${numericCols[0].name}` }],
          sort: { column: `Total ${numericCols[0].name}`, direction: 'desc' },
          limit: 10,
        },
      });

      // Pie / Donut chart (Composition)
      suggestions.push({
        type: 'pie',
        title: `${categoricalCols[0].name} Distribution`,
        description: `Proportional breakdown of ${numericCols[0].name} across top categories.`,
        confidence: 0.82,
        config: {
          dimension: categoricalCols[0].name,
          time_bucket: 'none',
          measures: [{ column: numericCols[0].name, aggregation: 'sum', label: `Total ${numericCols[0].name}` }],
          sort: { column: `Total ${numericCols[0].name}`, direction: 'desc' },
          limit: 6,
        },
      });
    }

    // 3. Single Numeric Column -> KPI Metric Card
    if (numericCols.length > 0) {
      suggestions.push({
        type: 'kpi',
        title: `Total ${numericCols[0].name}`,
        description: `High-impact summary metric for ${numericCols[0].name}.`,
        confidence: 0.88,
        config: {
          measure: { column: numericCols[0].name, aggregation: 'sum', label: `Total ${numericCols[0].name}` },
          date_column: dateCols[0]?.name || null,
        },
      });
    }

    // 4. Two Numeric Columns -> Scatter Plot (Correlation)
    if (numericCols.length >= 2) {
      suggestions.push({
        type: 'scatter',
        title: `${numericCols[0].name} vs ${numericCols[1].name}`,
        description: `Correlation analysis between ${numericCols[0].name} and ${numericCols[1].name}.`,
        confidence: 0.78,
        config: {
          dimension: numericCols[0].name,
          time_bucket: 'none',
          measures: [{ column: numericCols[1].name, aggregation: 'avg', label: numericCols[1].name }],
          limit: 50,
        },
      });
    }

    // 5. Default Fallback: Data Table
    suggestions.push({
      type: 'table',
      title: 'Detailed Records Table',
      description: 'Tabular overview of dataset records with sorting and filters.',
      confidence: 0.70,
      config: {
        dimension: categoricalCols[0]?.name || schemaProfile[0]?.name,
        time_bucket: 'none',
        measures: numericCols.slice(0, 3).map((col) => ({
          column: col.name,
          aggregation: 'sum',
          label: col.name,
        })),
        limit: 25,
      },
    });

    return suggestions;
  }
}

module.exports = new WidgetsEngine();
