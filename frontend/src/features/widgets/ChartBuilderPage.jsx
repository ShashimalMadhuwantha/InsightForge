import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Table as TableIcon,
  Activity,
  ArrowLeft,
  Save,
  Download,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Filter,
  Palette,
  Check,
  RefreshCw,
} from 'lucide-react';
import { widgetService } from '../../services/widgetService';
import { dataSourceService } from '../../services/dataSourceService';
import { ChartRenderer } from './components/ChartRenderer';
import { exportToCsv, exportToSvg, exportToPng } from './utils/chartExport';
import { LimitReachedModal } from '../packages/LimitReachedModal';

const WIDGET_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3, category: 'Comparison' },
  { id: 'line', label: 'Line Chart', icon: LineIcon, category: 'Trends' },
  { id: 'area', label: 'Area Chart', icon: Activity, category: 'Trends' },
  { id: 'pie', label: 'Pie Chart', icon: PieIcon, category: 'Composition' },
  { id: 'donut', label: 'Donut Chart', icon: PieIcon, category: 'Composition' },
  { id: 'kpi', label: 'KPI Metric', icon: Activity, category: 'Summary' },
  { id: 'table', label: 'Data Table', icon: TableIcon, category: 'Tabular' },
  { id: 'scatter', label: 'Scatter Plot', icon: Activity, category: 'Correlation' },
];

const PALETTE_OPTIONS = [
  { id: 'indigo', label: 'Cosmic Indigo', colors: ['#6366f1', '#06b6d4', '#10b981'] },
  { id: 'emerald', label: 'Emerald Mint', colors: ['#10b981', '#059669', '#34d399'] },
  { id: 'sunset', label: 'Sunset Amber', colors: ['#f43f5e', '#f59e0b', '#fbbf24'] },
  { id: 'violet', label: 'Neon Violet', colors: ['#a855f7', '#6366f1', '#818cf8'] },
  { id: 'cyan', label: 'Electric Cyan', colors: ['#06b6d4', '#38bdf8', '#6366f1'] },
];

export function ChartBuilderPage() {
  const navigate = useNavigate();
  const { id: editWidgetId } = useParams();
  const [searchParams] = useSearchParams();
  const initialDsId = searchParams.get('dataSourceId');

  // Core State
  const [dataSources, setDataSources] = useState([]);
  const [selectedDsId, setSelectedDsId] = useState(initialDsId || '');
  const [selectedDs, setSelectedDs] = useState(null);
  const [title, setTitle] = useState('Untitled Widget');
  const [description, setDescription] = useState('');
  const [widgetType, setWidgetType] = useState('bar');

  // Chart Config State
  const [dimension, setDimension] = useState('');
  const [timeBucket, setTimeBucket] = useState('none');
  const [measureCol, setMeasureCol] = useState('');
  const [aggregation, setAggregation] = useState('sum');
  const [measureLabel, setMeasureLabel] = useState('');
  const [filters, setFilters] = useState([]);
  const [sortCol, setSortCol] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [limitRows, setLimitRows] = useState(25);

  // Styling State
  const [palette, setPalette] = useState('indigo');
  const [format, setFormat] = useState('number');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Query & Suggestions State
  const [chartData, setChartData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  // Limit Modal State
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState('');
  const [requiredTier, setRequiredTier] = useState('Growth Business');

  const chartSvgRef = useRef(null);

  // Load Data Sources on Mount
  useEffect(() => {
    async function loadDataSources() {
      try {
        const res = await dataSourceService.listDataSources({ limit: 100 });
        const list = res.dataSources || res.data || [];
        setDataSources(list);

        if (!selectedDsId && list.length > 0) {
          setSelectedDsId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load data sources', err);
      }
    }
    loadDataSources();
  }, [selectedDsId]);

  // Load Existing Widget for Edit Mode
  useEffect(() => {
    if (!editWidgetId) return;

    async function loadWidget() {
      try {
        const res = await widgetService.getWidgetById(editWidgetId);
        const w = res.data || res;
        if (!w) return;

        setTitle(w.title || 'Untitled Widget');
        setDescription(w.description || '');
        setWidgetType(w.type || 'bar');
        setSelectedDsId(w.data_source_id);

        const cfg = w.config || {};
        setDimension(cfg.dimension || '');
        setTimeBucket(cfg.time_bucket || 'none');
        if (cfg.measures && cfg.measures[0]) {
          setMeasureCol(cfg.measures[0].column || '');
          setAggregation(cfg.measures[0].aggregation || 'sum');
          setMeasureLabel(cfg.measures[0].label || '');
        }
        if (cfg.measure) {
          setMeasureCol(cfg.measure.column || '');
          setAggregation(cfg.measure.aggregation || 'sum');
          setMeasureLabel(cfg.measure.label || '');
        }
        setFilters(cfg.filters || []);
        if (cfg.sort) {
          setSortCol(cfg.sort.column || '');
          setSortDir(cfg.sort.direction || 'asc');
        }
        if (cfg.limit) setLimitRows(cfg.limit);

        const st = cfg.styling || {};
        if (st.palette) setPalette(st.palette);
        if (st.format) setFormat(st.format);
        if (st.showLegend !== undefined) setShowLegend(st.showLegend);
        if (st.showGrid !== undefined) setShowGrid(st.showGrid);
      } catch (err) {
        console.error('Failed to load widget for editing', err);
      }
    }
    loadWidget();
  }, [editWidgetId]);

  // Load Selected Data Source Details & Smart Suggestions
  useEffect(() => {
    if (!selectedDsId) return;

    async function loadDatasetAndSuggestions() {
      try {
        const ds = await dataSourceService.getDataSourceById(selectedDsId);
        setSelectedDs(ds);

        // Auto-select initial dimension & measure if empty
        const schema = ds?.schema_profile || [];
        if (schema.length > 0 && !dimension) {
          const cat = schema.find((c) => c.inferredType === 'string') || schema[0];
          setDimension(cat.name);
        }
        if (schema.length > 0 && !measureCol) {
          const num = schema.find((c) => c.inferredType === 'numeric') || schema[0];
          setMeasureCol(num.name);
          setMeasureLabel(`Total ${num.name}`);
        }

        // Fetch smart suggestions
        const suggRes = await widgetService.getSuggestions(selectedDsId);
        setSuggestions(suggRes.data?.suggestions || suggRes.suggestions || []);
      } catch (err) {
        console.error('Failed to load dataset details or suggestions', err);
      }
    }
    loadDatasetAndSuggestions();
  }, [selectedDsId, dimension, measureCol]);

  // Execute Live Query Preview on Config Change
  const runQuery = useCallback(async () => {
    if (!selectedDsId) return;

    setQueryLoading(true);
    try {
      const config = {
        dimension: dimension || null,
        time_bucket: timeBucket,
        measures: [
          {
            column: measureCol,
            aggregation,
            label: measureLabel || `${aggregation}_${measureCol}`,
          },
        ],
        measure: {
          column: measureCol,
          aggregation,
          label: measureLabel || `${aggregation}_${measureCol}`,
        },
        filters,
        sort: sortCol ? { column: sortCol, direction: sortDir } : null,
        limit: parseInt(limitRows, 10) || 50,
        styling: {
          palette,
          format,
          showLegend,
          showGrid,
        },
      };

      const res = await widgetService.queryWidgetData({
        dataSourceId: selectedDsId,
        type: widgetType,
        config,
      });

      setChartData(res.data);
      setExecutionTime(res.data.executionTimeMs);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'FEATURE_NOT_INCLUDED') {
        setLockedFeature(widgetType);
        setRequiredTier('Growth Business');
        setLimitModalOpen(true);
      } else {
        console.error('Widget query execution failed', err);
      }
    } finally {
      setQueryLoading(false);
    }
  }, [
    selectedDsId,
    widgetType,
    dimension,
    timeBucket,
    measureCol,
    aggregation,
    measureLabel,
    filters,
    sortCol,
    sortDir,
    limitRows,
    palette,
    format,
    showLegend,
    showGrid,
  ]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  // Handle Chart Type Selection (with Entitlement Check)
  const handleTypeSelect = (typeId) => {
    const suggMatch = suggestions.find((s) => s.type === typeId);
    if (suggMatch && suggMatch.isLocked) {
      setLockedFeature(typeId);
      setRequiredTier('Growth Business');
      setLimitModalOpen(true);
      return;
    }
    setWidgetType(typeId);
  };

  // Apply Smart Suggestion
  const handleApplySuggestion = (sugg) => {
    if (sugg.isLocked) {
      setLockedFeature(sugg.type);
      setRequiredTier('Growth Business');
      setLimitModalOpen(true);
      return;
    }

    setWidgetType(sugg.type);
    setTitle(sugg.title || title);
    if (sugg.config) {
      if (sugg.config.dimension) setDimension(sugg.config.dimension);
      if (sugg.config.time_bucket) setTimeBucket(sugg.config.time_bucket);
      if (sugg.config.measures && sugg.config.measures[0]) {
        setMeasureCol(sugg.config.measures[0].column);
        setAggregation(sugg.config.measures[0].aggregation);
        setMeasureLabel(sugg.config.measures[0].label);
      }
      if (sugg.config.measure) {
        setMeasureCol(sugg.config.measure.column);
        setAggregation(sugg.config.measure.aggregation);
        setMeasureLabel(sugg.config.measure.label);
      }
      if (sugg.config.limit) setLimitRows(sugg.config.limit);
    }
  };

  // Add / Remove Filters
  const handleAddFilter = () => {
    const firstCol = selectedDs?.schema_profile?.[0]?.name || '';
    setFilters([...filters, { column: firstCol, operator: 'eq', value: '' }]);
  };

  const handleUpdateFilter = (idx, key, val) => {
    const updated = [...filters];
    updated[idx][key] = val;
    setFilters(updated);
  };

  const handleRemoveFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  // Save Widget
  const handleSaveWidget = async () => {
    if (!title.trim()) {
      alert('Please provide a title for the widget.');
      return;
    }
    if (!selectedDsId) {
      alert('Please choose a dataset for the widget.');
      return;
    }

    setSaving(true);
    try {
      const configPayload = {
        dimension: dimension || null,
        time_bucket: timeBucket,
        measures: [
          {
            column: measureCol,
            aggregation,
            label: measureLabel || `${aggregation}_${measureCol}`,
          },
        ],
        measure: {
          column: measureCol,
          aggregation,
          label: measureLabel || `${aggregation}_${measureCol}`,
        },
        filters,
        sort: sortCol ? { column: sortCol, direction: sortDir } : null,
        limit: parseInt(limitRows, 10) || 50,
        styling: {
          palette,
          format,
          showLegend,
          showGrid,
        },
      };

      const payload = {
        title: title.trim(),
        description: description ? description.trim() : null,
        type: widgetType,
        data_source_id: selectedDsId,
        config: configPayload,
      };

      if (editWidgetId) {
        await widgetService.updateWidget(editWidgetId, payload);
      } else {
        await widgetService.createWidget(payload);
      }

      navigate('/widgets');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'FEATURE_NOT_INCLUDED') {
        setLockedFeature(widgetType);
        setRequiredTier('Growth Business');
        setLimitModalOpen(true);
      } else {
        alert(err.response?.data?.message || 'Failed to save widget');
      }
    } finally {
      setSaving(false);
    }
  };

  const schemaColumns = selectedDs?.schema_profile || [];
  const isDimensionDate = schemaColumns.some(
    (c) => c.name === dimension && (c.inferredType === 'date' || c.dataType === 'date')
  );

  return (
    <div style={{ padding: '24px 36px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/widgets')}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Widgets</span>
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget Title..."
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                letterSpacing: '-0.02em',
                width: '100%',
                maxWidth: '400px',
              }}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {editWidgetId ? 'Edit visualization settings' : 'Configure and preview chart visualization'}
            </div>
          </div>
        </div>

        {/* Action Buttons & Exports */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Export Dropdown */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => exportToCsv(`${title || 'chart'}.csv`, chartData?.queryResult?.tableData)}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Export aggregated data to CSV"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportToSvg(chartSvgRef.current, `${title || 'chart'}.svg`)}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Export vector SVG"
            >
              <Download size={14} />
              <span>SVG</span>
            </button>
            <button
              onClick={() => exportToPng(chartSvgRef.current, `${title || 'chart'}.png`)}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Export high-resolution PNG"
            >
              <Download size={14} />
              <span>PNG</span>
            </button>
          </div>

          <button
            onClick={handleSaveWidget}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : editWidgetId ? 'Update Widget' : 'Save Widget'}</span>
          </button>
        </div>
      </div>

      {/* Smart Suggestions Banner */}
      {suggestions.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', flexShrink: 0 }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>Smart Suggestions:</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap' }}>
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => handleApplySuggestion(sugg)}
                className="btn btn-ghost"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card-highlight)',
                  whiteSpace: 'nowrap',
                }}
              >
                {sugg.isLocked && <Lock size={12} color="var(--warning)" />}
                <span style={{ fontWeight: 600 }}>{sugg.title}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({sugg.type})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Studio 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Sidebar: Controls & Field Mapping */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Dataset Selector */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Source Dataset
            </label>
            <select
              value={selectedDsId}
              onChange={(e) => setSelectedDsId(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '10px 14px' }}
            >
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} (v{ds.current_version}) — {ds.row_count} rows
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Selector Grid */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Chart Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {WIDGET_TYPES.map((wt) => {
                const Icon = wt.icon;
                const isSelected = widgetType === wt.id;
                const suggMatch = suggestions.find((s) => s.type === wt.id);
                const isLocked = suggMatch?.isLocked;

                return (
                  <button
                    key={wt.id}
                    type="button"
                    onClick={() => handleTypeSelect(wt.id)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSelected ? 'var(--accent-glow-subtle)' : 'var(--bg-card)',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isLocked && (
                      <Lock
                        size={12}
                        color="var(--warning)"
                        style={{ position: 'absolute', top: 4, right: 4 }}
                      />
                    )}
                    <Icon size={18} color={isSelected ? 'var(--accent-primary)' : 'inherit'} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{wt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension (X-Axis) Mapping */}
          {widgetType !== 'kpi' && (
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Dimension (X-Axis / Category)
              </label>
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '10px 14px' }}
              >
                {schemaColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.inferredType})
                  </option>
                ))}
              </select>

              {/* Time Bucket if Dimension is a Date */}
              {isDimensionDate && (
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Time Aggregation Bucket
                  </label>
                  <select
                    value={timeBucket}
                    onChange={(e) => setTimeBucket(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="none">Exact Date (No Bucket)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Measure (Y-Axis) & Aggregation */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {widgetType === 'kpi' ? 'Target Metric' : 'Measure (Y-Axis Value)'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '8px' }}>
              <select
                value={measureCol}
                onChange={(e) => {
                  setMeasureCol(e.target.value);
                  setMeasureLabel(`${aggregation} of ${e.target.value}`);
                }}
                className="form-control"
                style={{ padding: '10px 14px' }}
              >
                {schemaColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.inferredType})
                  </option>
                ))}
              </select>

              <select
                value={aggregation}
                onChange={(e) => {
                  setAggregation(e.target.value);
                  setMeasureLabel(`${e.target.value} of ${measureCol}`);
                }}
                className="form-control"
                style={{ padding: '10px 10px', fontWeight: 700 }}
              >
                <option value="sum">SUM</option>
                <option value="avg">AVG</option>
                <option value="count">COUNT</option>
                <option value="min">MIN</option>
                <option value="max">MAX</option>
              </select>
            </div>
          </div>

          {/* Filters Builder Accordion */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Filters ({filters.length})
              </label>
              <button
                type="button"
                onClick={handleAddFilter}
                className="btn btn-ghost"
                style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} />
                <span>Add Filter</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filters.map((flt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 1fr 28px',
                    gap: '6px',
                    alignItems: 'center',
                    background: 'var(--bg-card)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <select
                    value={flt.column}
                    onChange={(e) => handleUpdateFilter(idx, 'column', e.target.value)}
                    className="form-control"
                    style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                  >
                    {schemaColumns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={flt.operator}
                    onChange={(e) => handleUpdateFilter(idx, 'operator', e.target.value)}
                    className="form-control"
                    style={{ padding: '6px 6px', fontSize: '0.78rem' }}
                  >
                    <option value="eq">Equals</option>
                    <option value="neq">Not Equals</option>
                    <option value="gt">&gt; Greater</option>
                    <option value="lt">&lt; Less</option>
                    <option value="contains">Contains</option>
                  </select>

                  <input
                    type="text"
                    value={flt.value}
                    onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                    placeholder="Value..."
                    className="form-control"
                    style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(idx)}
                    className="btn-icon"
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sort & Limit */}
          {widgetType !== 'kpi' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Sort Order
                </label>
                <select
                  value={sortDir}
                  onChange={(e) => {
                    setSortDir(e.target.value);
                    setSortCol(measureLabel || `${aggregation}_${measureCol}`);
                  }}
                  className="form-control"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="desc">Descending (Top)</option>
                  <option value="asc">Ascending (Bottom)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Limit Records
                </label>
                <select
                  value={limitRows}
                  onChange={(e) => setLimitRows(e.target.value)}
                  className="form-control"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="25">Top 25</option>
                  <option value="50">Top 50</option>
                  <option value="100">Top 100</option>
                </select>
              </div>
            </div>
          )}

          {/* Visual Customization & Palettes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <Palette size={15} />
              <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>
                Theme & Number Formatting
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {PALETTE_OPTIONS.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => setPalette(pal.id)}
                  style={{
                    flex: 1,
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: palette === pal.id ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                    background: pal.colors[0],
                    cursor: 'pointer',
                  }}
                  title={pal.label}
                >
                  {palette === pal.id && <Check size={14} color="#fff" />}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                >
                  <option value="number">Number</option>
                  <option value="currency">Currency ($)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                  />
                  <span>Show Legend</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  <span>Show Grid</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right: Live Chart Preview Canvas */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: '600px',
          }}
        >
          {/* Canvas Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                {title || 'Untitled Visualization'}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedDs?.name} • Version {selectedDs?.current_version} • {chartData?.queryResult?.categories?.length || 0} Categories
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {executionTime !== null && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  ⚡ {executionTime}ms
                </span>
              )}
              <button
                onClick={runQuery}
                disabled={queryLoading}
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Refresh query results"
              >
                <RefreshCw size={14} className={queryLoading ? 'spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Live Chart Renderer Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              position: 'relative',
            }}
          >
            <ChartRenderer
              ref={chartSvgRef}
              type={widgetType}
              data={chartData}
              config={{
                dimension,
                measure: { column: measureCol, aggregation, label: measureLabel },
                styling: { palette, format, showLegend, showGrid },
              }}
              height={440}
              loading={queryLoading}
            />
          </div>
        </div>
      </div>

      {/* Package Limit Reached Modal */}
      <LimitReachedModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        limitType="widget_type"
        featureName={lockedFeature}
        requiredTier={requiredTier}
      />
    </div>
  );
}
