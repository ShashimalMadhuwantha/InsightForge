import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

const PALETTES = {
  indigo: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'],
  emerald: ['#10b981', '#059669', '#34d399', '#06b6d4', '#6366f1', '#38bdf8'],
  sunset: ['#f43f5e', '#fb7185', '#f59e0b', '#fbbf24', '#a855f7', '#6366f1'],
  violet: ['#a855f7', '#c084fc', '#6366f1', '#818cf8', '#06b6d4', '#10b981'],
  cyan: ['#06b6d4', '#38bdf8', '#6366f1', '#10b981', '#f59e0b', '#ec4899'],
};

/**
 * Format numerical values according to configuration
 */
export function formatMetricValue(val, format = 'number', prefix = '', suffix = '') {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = parseFloat(val);

  let formatted = '';
  if (format === 'currency') {
    formatted = `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  } else if (format === 'percent') {
    formatted = `${num.toFixed(1)}%`;
  } else if (Math.abs(num) >= 1000000) {
    formatted = `${(num / 1000000).toFixed(1)}M`;
  } else if (Math.abs(num) >= 1000) {
    formatted = `${(num / 1000).toFixed(1)}k`;
  } else {
    formatted = num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return `${prefix || ''}${formatted}${suffix || ''}`;
}

export const ChartRenderer = React.forwardRef(function ChartRenderer(
  {
    type = 'bar',
    data = null,
    config = {},
    height = 360,
    loading = false,
  },
  ref
) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const styling = config.styling || {};
  const paletteName = styling.palette || 'indigo';
  const colors = PALETTES[paletteName] || PALETTES.indigo;
  const showGrid = styling.showGrid !== false;
  const showLegend = styling.showLegend !== false;
  const format = styling.format || 'number';
  const prefix = styling.prefix || '';
  const suffix = styling.suffix || '';

  // KPI Render Mode
  if (type === 'kpi') {
    if (loading) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing metric...
        </div>
      );
    }

    const kpi = data?.queryResult || { current: 0, previous: null, change: 0, changePct: 0, trend: 'neutral' };
    const label = config.measure?.label || config.measure?.column || 'Total';
    const isUp = kpi.trend === 'up';
    const isDown = kpi.trend === 'down';

    return (
      <div
        style={{
          padding: '28px 32px',
          borderRadius: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card-highlight)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </span>
          {kpi.previous !== null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: isUp ? 'var(--success-bg)' : isDown ? 'var(--error-bg)' : 'var(--bg-secondary)',
                color: isUp ? 'var(--success)' : isDown ? 'var(--error)' : 'var(--text-secondary)',
                border: `1px solid ${isUp ? 'var(--success-border)' : isDown ? 'var(--error-border)' : 'var(--border-subtle)'}`,
              }}
            >
              {isUp ? <ArrowUpRight size={14} /> : isDown ? <ArrowDownRight size={14} /> : <Minus size={14} />}
              {Math.abs(kpi.changePct)}%
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {formatMetricValue(kpi.current, format, prefix, suffix)}
        </div>

        {kpi.previous !== null && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            vs previous period ({formatMetricValue(kpi.previous, format, prefix, suffix)})
          </div>
        )}
      </div>
    );
  }

  // Data Table Render Mode
  if (type === 'table') {
    const tableData = data?.queryResult?.tableData || [];
    if (loading) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading table records...
        </div>
      );
    }
    if (tableData.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No records match the selected criteria.
        </div>
      );
    }

    const columns = Object.keys(tableData[0]);

    return (
      <div
        style={{
          maxHeight: `${height}px`,
          overflow: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 2 }}>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '12px 16px',
                    textAlign: typeof tableData[0][col] === 'number' ? 'right' : 'left',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: rIdx % 2 === 0 ? 'transparent' : 'var(--bg-card)',
                  transition: 'background 0.15s ease',
                }}
              >
                {columns.map((col) => {
                  const val = row[col];
                  const isNum = typeof val === 'number';
                  return (
                    <td
                      key={col}
                      style={{
                        padding: '10px 16px',
                        textAlign: isNum ? 'right' : 'left',
                        fontVariantNumeric: isNum ? 'tabular-nums' : 'normal',
                        color: isNum ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {isNum ? formatMetricValue(val, format, prefix, suffix) : String(val ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Common SVG Chart Processing
  const queryResult = data?.queryResult || { categories: [], series: [] };
  const categories = queryResult.categories || [];
  const series = queryResult.series || [];

  const maxVal = useMemo(() => {
    let max = 0;
    series.forEach((s) => {
      (s.data || []).forEach((v) => {
        if (typeof v === 'number' && v > max) max = v;
      });
    });
    return max > 0 ? max * 1.15 : 100;
  }, [series]);

  if (loading) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        Rendering visualization...
      </div>
    );
  }

  if (categories.length === 0 || series.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          gap: '8px',
        }}
      >
        <AlertCircle size={28} />
        <span>No chart data available. Map dimensions & measures to preview.</span>
      </div>
    );
  }

  const svgWidth = 700;
  const svgHeight = height;
  const margin = { top: 25, right: 30, bottom: 50, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Pie & Donut Calculation
  if (type === 'pie' || type === 'donut') {
    const pieSeries = series[0]?.data || [];
    const total = pieSeries.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
    const radius = Math.min(plotWidth, plotHeight) / 2 - 15;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2 - 10;
    const innerRadius = type === 'donut' ? radius * 0.58 : 0;

    let cumulativeAngle = -Math.PI / 2;
    const slices = categories.map((cat, idx) => {
      const val = pieSeries[idx] || 0;
      const angle = total > 0 ? (val / total) * 2 * Math.PI : 0;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const ix1 = centerX + innerRadius * Math.cos(endAngle);
      const iy1 = centerY + innerRadius * Math.sin(endAngle);
      const ix2 = centerX + innerRadius * Math.cos(startAngle);
      const iy2 = centerY + innerRadius * Math.sin(startAngle);

      const largeArcFlag = angle > Math.PI ? 1 : 0;
      const pathData = innerRadius > 0
        ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`
        : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;

      return {
        category: cat,
        value: val,
        pct,
        path: pathData,
        color: colors[idx % colors.length],
      };
    });

    return (
      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg
          ref={ref}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <g>
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.path}
                fill={slice.color}
                stroke="var(--bg-secondary)"
                strokeWidth={2}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                  opacity: hoveredItem && hoveredItem.category !== slice.category ? 0.45 : 1,
                }}
                onMouseEnter={() => setHoveredItem(slice)}
                onMouseLeave={() => setHoveredItem(null)}
              />
            ))}

            {type === 'donut' && (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text-primary)"
                fontSize="18"
                fontWeight="800"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatMetricValue(total, format, prefix, suffix)}
              </text>
            )}
          </g>
        </svg>

        {showLegend && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '4px',
              fontSize: '0.78rem',
            }}
          >
            {slices.map((slice, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredItem(slice)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: slice.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{slice.category}:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{slice.pct}%</span>
              </div>
            ))}
          </div>
        )}

        {hoveredItem && (
          <div
            style={{
              position: 'absolute',
              top: 15,
              right: 15,
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredItem.category}</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {formatMetricValue(hoveredItem.value, format, prefix, suffix)} ({hoveredItem.pct}%)
            </div>
          </div>
        )}
      </div>
    );
  }

  // Bar, Line, Area, Scatter Renderers
  const stepX = plotWidth / (categories.length || 1);
  const barWidth = Math.max(12, Math.min(stepX * 0.65 / (series.length || 1), 48));

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = plotHeight * (1 - ratio);
              const val = maxVal * ratio;
              return (
                <g key={idx}>
                  <line
                    x1={0}
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={-10}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--text-muted)"
                    fontSize="11"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatMetricValue(val, format, prefix, suffix)}
                  </text>
                </g>
              );
            })}

          {/* Bar Chart Bars */}
          {type === 'bar' &&
            categories.map((cat, cIdx) => {
              const groupCenterX = cIdx * stepX + stepX / 2;
              const totalBarsWidth = series.length * barWidth;
              const startX = groupCenterX - totalBarsWidth / 2;

              return (
                <g key={cIdx}>
                  {series.map((s, sIdx) => {
                    const val = s.data[cIdx] || 0;
                    const barHeight = (val / maxVal) * plotHeight;
                    const x = startX + sIdx * barWidth;
                    const y = plotHeight - barHeight;
                    const color = colors[sIdx % colors.length];

                    return (
                      <rect
                        key={sIdx}
                        x={x}
                        y={y}
                        width={barWidth - 3}
                        height={Math.max(0, barHeight)}
                        rx={3}
                        fill={color}
                        style={{
                          cursor: 'pointer',
                          transition: 'opacity 0.2s ease',
                          opacity: hoveredItem && hoveredItem.category !== cat ? 0.45 : 0.9,
                        }}
                        onMouseEnter={() =>
                          setHoveredItem({ category: cat, series: s.name, value: val, x, y })
                        }
                        onMouseLeave={() => setHoveredItem(null)}
                      />
                    );
                  })}
                </g>
              );
            })}

          {/* Line & Area Chart Paths */}
          {(type === 'line' || type === 'area') &&
            series.map((s, sIdx) => {
              const color = colors[sIdx % colors.length];
              const points = categories.map((cat, cIdx) => {
                const x = cIdx * stepX + stepX / 2;
                const val = s.data[cIdx] || 0;
                const y = plotHeight - (val / maxVal) * plotHeight;
                return { x, y, cat, val };
              });

              const pathString = points.reduce((acc, pt, i) => {
                return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
              }, '');

              const areaPath = points.length > 0
                ? `${pathString} L ${points[points.length - 1].x} ${plotHeight} L ${points[0].x} ${plotHeight} Z`
                : '';

              return (
                <g key={sIdx}>
                  {type === 'area' && (
                    <path
                      d={areaPath}
                      fill={color}
                      fillOpacity={0.22}
                    />
                  )}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((pt, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={color}
                      stroke="var(--bg-secondary)"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() =>
                        setHoveredItem({ category: pt.cat, series: s.name, value: pt.val, x: pt.x, y: pt.y })
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                    />
                  ))}
                </g>
              );
            })}

          {/* Scatter Plot */}
          {type === 'scatter' &&
            categories.map((cat, cIdx) => {
              const x = (cIdx / (categories.length || 1)) * plotWidth + 15;
              const s = series[0];
              const val = s?.data[cIdx] || 0;
              const y = plotHeight - (val / maxVal) * plotHeight;
              const color = colors[0];

              return (
                <circle
                  key={cIdx}
                  cx={x}
                  cy={y}
                  r={6}
                  fill={color}
                  fillOpacity={0.8}
                  stroke="var(--bg-primary)"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setHoveredItem({ category: cat, series: s?.name, value: val, x, y })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                />
              );
            })}

          {/* X Axis Labels */}
          {categories.map((cat, cIdx) => {
            const x = cIdx * stepX + stepX / 2;
            const label = String(cat).length > 12 ? `${String(cat).slice(0, 10)}...` : String(cat);
            return (
              <text
                key={cIdx}
                x={x}
                y={plotHeight + 20}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                transform={categories.length > 8 ? `rotate(-25, ${x}, ${plotHeight + 20})` : undefined}
              >
                {label}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Hover Tooltip Box */}
      {hoveredItem && (
        <div
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            padding: '8px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredItem.category}</div>
          {hoveredItem.series && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{hoveredItem.series}</div>
          )}
          <div style={{ fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
            {formatMetricValue(hoveredItem.value, format, prefix, suffix)}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && series.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            marginTop: '8px',
            fontSize: '0.8rem',
          }}
        >
          {series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: colors[i % colors.length] }} />
              <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
