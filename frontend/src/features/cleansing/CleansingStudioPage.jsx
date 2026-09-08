import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Wand2,
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  Layers,
  Table,
  Lock,
  RefreshCw,
  Hash,
  Type,
  Calendar,
  Filter,
  Sliders,
  Scissors
} from 'lucide-react';
import { dataSourceService } from '../../services/dataSourceService';
import { cleansingService } from '../../services/cleansingService';
import { LimitReachedModal } from '../packages/LimitReachedModal';

// Available Cleansing Operators with Tier Lock Levels
const AVAILABLE_OPERATIONS = [
  {
    type: 'remove_duplicates',
    name: 'Remove Duplicates',
    category: 'Quality',
    description: 'Deduplicate identical rows across all columns or key subsets.',
    requiredTier: 'free',
    icon: Layers,
    defaultOptions: { subsetColumns: [] },
  },
  {
    type: 'drop_missing',
    name: 'Drop Missing Rows',
    category: 'Quality',
    description: 'Drop any row that contains empty or null values.',
    requiredTier: 'starter',
    icon: Scissors,
    defaultOptions: { columns: [] },
  },
  {
    type: 'handle_missing',
    name: 'Impute Missing Values',
    category: 'Quality',
    description: 'Fill nulls with numeric Mean, Median, Mode, or Constant value.',
    requiredTier: 'starter',
    icon: Wand2,
    defaultOptions: { column: '', strategy: 'mean', fillValue: '' },
  },
  {
    type: 'text_standardization',
    name: 'Text Cleanup & Casing',
    category: 'Formatting',
    description: 'Trim whitespace, convert to Lowercase, Uppercase, or Title Case.',
    requiredTier: 'free',
    icon: Type,
    defaultOptions: { column: '', operation: 'trim' },
  },
  {
    type: 'type_cast',
    name: 'Standardize Data Type',
    category: 'Types & Structure',
    description: 'Cast values to clean Numbers, standard ISO Dates, or Booleans.',
    requiredTier: 'starter',
    icon: Hash,
    defaultOptions: { column: '', targetType: 'numeric' },
  },
  {
    type: 'drop_column',
    name: 'Drop Columns',
    category: 'Types & Structure',
    description: 'Remove unwanted or redundant columns from dataset.',
    requiredTier: 'starter',
    icon: Trash2,
    defaultOptions: { columns: [] },
  },
  {
    type: 'filter_rows',
    name: 'Filter Rows',
    category: 'Filtering',
    description: 'Filter rows based on conditional expressions (equals, >, <, contains).',
    requiredTier: 'starter',
    icon: Filter,
    defaultOptions: { column: '', operator: 'equals', value: '' },
  },
  {
    type: 'outlier_detection',
    name: 'Statistical Outlier Detection',
    category: 'Advanced Stats',
    description: 'Detect anomalies using IQR or Z-Score. Filter or cap (winsorize) values.',
    requiredTier: 'growth', // Pro / Enterprise
    icon: Sliders,
    defaultOptions: { column: '', method: 'iqr', threshold: 1.5, action: 'filter' },
  },
];

export function CleansingStudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dataSource, setDataSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [recipe, setRecipe] = useState([]);
  const recipeRef = React.useRef(recipe);
  recipeRef.current = recipe;

  const [previewResult, setPreviewResult] = useState(null);
  const [selectedPreviewTab, setSelectedPreviewTab] = useState('diff'); // 'diff' | 'transformed' | 'original'

  // Modal state for locked features
  const [quotaExceededModal, setQuotaExceededModal] = useState({
    isOpen: false,
    limitType: 'cleansing_op',
    currentUsage: 2,
    maxLimit: 2,
  });

  // Modal to pick operation to add
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load Data Source & Initial Preview
  const loadDataSource = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const ds = await dataSourceService.getDataSourceById(id);
      setDataSource(ds);
      // Auto trigger initial dry run preview with empty recipe
      runDryRunPreview(ds.id, []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load dataset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataSource();
  }, [id]);

  const runDryRunPreview = async (dsId, currentRecipe) => {
    setPreviewLoading(true);
    setErrorMessage('');
    try {
      const preview = await cleansingService.previewCleansing(dsId || id, currentRecipe);
      setPreviewResult(preview);
    } catch (err) {
      if (err.response?.data?.code === 'FEATURE_NOT_INCLUDED' || err.status === 403) {
        setQuotaExceededModal({
          isOpen: true,
          limitType: 'cleansing_op',
          currentUsage: 2,
          maxLimit: 2,
        });
      } else {
        setErrorMessage(err.message || 'Failed to generate transformation preview.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // Add Step to Recipe
  const handleAddOperation = (op) => {
    const newStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: op.type,
      name: op.name,
      options: {
        ...op.defaultOptions,
        column: dataSource?.schema_profile?.[0]?.name || '',
      },
    };

    setRecipe((prev) => {
      const updated = [...prev, newStep];
      recipeRef.current = updated;
      runDryRunPreview(id, updated);
      return updated;
    });
    setPickerModalOpen(false);
  };

  // Update step options
  const handleUpdateStepOptions = (stepId, updatedOptions) => {
    setRecipe((prev) => {
      const updated = prev.map((step) =>
        step.id === stepId ? { ...step, options: { ...step.options, ...updatedOptions } } : step
      );
      recipeRef.current = updated;
      return updated;
    });
  };

  // Remove step
  const handleRemoveStep = (stepId) => {
    setRecipe((prev) => {
      const updated = prev.filter((s) => s.id !== stepId);
      recipeRef.current = updated;
      runDryRunPreview(id, updated);
      return updated;
    });
  };

  // Reorder steps
  const handleMoveStep = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= recipe.length) return;

    setRecipe((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      recipeRef.current = updated;
      runDryRunPreview(id, updated);
      return updated;
    });
  };

  // Apply recipe
  const handleApplyRecipe = async () => {
    const currentSteps = recipeRef.current;
    if (!currentSteps || currentSteps.length === 0) {
      setErrorMessage('Please add at least one cleansing operation before applying.');
      return;
    }

    setApplying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await cleansingService.applyCleansing(id, currentSteps);
      setSuccessMessage(res.message || 'Dataset cleansed successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/data-sources/${id}/status`);
      }, 1500);
    } catch (err) {
      if (err.response?.data?.code === 'FEATURE_NOT_INCLUDED' || err.status === 403) {
        setQuotaExceededModal({
          isOpen: true,
          limitType: 'cleansing_op',
          currentUsage: 2,
          maxLimit: 2,
        });
      } else {
        setErrorMessage(err.message || 'Failed to apply transformation recipe.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading && !dataSource) {
    return (
      <div style={{ maxWidth: '1240px', margin: '4rem auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="pulse-glow" style={{ fontSize: '1rem', fontWeight: 600 }}>
          Initializing Data Cleansing Studio...
        </div>
      </div>
    );
  }

  const columns = dataSource?.schema_profile || [];
  const beforeScore = previewResult?.before?.qualityScore ?? (dataSource?.quality_metrics?.overall_score || 80);
  const afterScore = previewResult?.after?.qualityScore ?? beforeScore;
  const scoreDiff = afterScore - beforeScore;

  const categories = ['All', 'Quality', 'Formatting', 'Types & Structure', 'Filtering', 'Advanced Stats'];
  const filteredOperations = selectedCategory === 'All'
    ? AVAILABLE_OPERATIONS
    : AVAILABLE_OPERATIONS.filter((op) => op.category === selectedCategory);

  return (
    <div style={{ maxWidth: '1440px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to={`/data-sources/${id}/status`} className="btn-icon" title="Back to Dataset Status">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-inverse)' }}>
                <Wand2 size={18} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Data Cleansing Studio
              </h1>
              <span className="status-pill info" style={{ fontSize: '0.7rem' }}>
                Target: {dataSource?.name || 'Dataset'} (v{dataSource?.current_version || 1})
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Configure a declarative transformation recipe with live before/after diff preview and statistical outlier detection.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => runDryRunPreview(id, recipe)}
            disabled={previewLoading || applying}
            className="btn btn-outline"
            data-testid="preview-refresh-btn"
          >
            <RefreshCw size={15} className={previewLoading ? 'pulse-glow' : ''} />
            <span>{previewLoading ? 'Previewing...' : 'Refresh Preview'}</span>
          </button>

          <button
            onClick={handleApplyRecipe}
            disabled={applying || recipe.length === 0}
            className="btn btn-primary"
            data-testid="apply-cleansing-btn"
            style={{ padding: '0.65rem 1.5rem' }}
          >
            {applying ? (
              <>
                <RefreshCw size={16} className="pulse-glow" />
                <span>Applying Recipe...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Apply Cleansing Recipe ({recipe.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div data-testid="cleansing-success-alert" style={{ padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div data-testid="cleansing-error-alert" style={{ padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Studio Grid (Left: Recipe Pipeline Builder, Right: Live Preview Panel) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Transformation Pipeline Builder */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="section-tag" style={{ color: 'var(--accent-primary)' }}>TRANSFORMATION PIPELINE</span>
              <span className="status-pill active" style={{ fontSize: '0.7rem' }}>{recipe.length} Steps</span>
            </div>
            
            <button
              onClick={() => setPickerModalOpen(true)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              data-testid="add-step-btn"
            >
              <Plus size={14} />
              <span>Add Step</span>
            </button>
          </div>

          {/* Steps List */}
          {recipe.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
              <Wand2 size={32} color="var(--accent-primary)" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Transformation Steps Yet</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Add cleansing operations like duplicate removal, null imputation, or outlier filtering.
              </p>
              <button
                onClick={() => setPickerModalOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={14} />
                <span>Choose First Operation</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recipe.map((step, idx) => (
                <div
                  key={step.id}
                  data-testid={`recipe-step-${idx}`}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.15rem',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Step Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tabular-nums" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.9rem' }}>{step.name || step.type}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, -1)}
                        disabled={idx === 0}
                        className="btn-icon"
                        style={{ width: '24px', height: '24px' }}
                        title="Move Step Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 1)}
                        disabled={idx === recipe.length - 1}
                        className="btn-icon"
                        style={{ width: '24px', height: '24px' }}
                        title="Move Step Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(step.id)}
                        className="btn-icon"
                        style={{ width: '24px', height: '24px' }}
                        title="Delete Step"
                      >
                        <Trash2 size={14} color="var(--error)" />
                      </button>
                    </div>
                  </div>

                  {/* Step Dynamic Configuration Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* Target Column Selector (if operation targets specific columns) */}
                    {['handle_missing', 'text_standardization', 'type_cast', 'filter_rows', 'outlier_detection'].includes(step.type) && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Column</label>
                        <select
                          value={step.options?.column || ''}
                          onChange={(e) => handleUpdateStepOptions(step.id, { column: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                        >
                          {columns.map((c, cIdx) => (
                            <option key={cIdx} value={c.name}>{c.name} ({c.type})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Handle Missing Parameters */}
                    {step.type === 'handle_missing' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Imputation Method</label>
                          <select
                            value={step.options?.strategy || 'mean'}
                            onChange={(e) => handleUpdateStepOptions(step.id, { strategy: e.target.value })}
                            style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                          >
                            <option value="mean">Mean (Average)</option>
                            <option value="median">Median</option>
                            <option value="mode">Mode (Most Frequent)</option>
                            <option value="constant">Constant Value</option>
                            <option value="forward_fill">Forward Fill</option>
                            <option value="drop_row">Drop Null Rows</option>
                          </select>
                        </div>

                        {step.options?.strategy === 'constant' && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Fill Value</label>
                            <input
                              type="text"
                              value={step.options?.fillValue || ''}
                              onChange={(e) => handleUpdateStepOptions(step.id, { fillValue: e.target.value })}
                              placeholder="e.g. 0 or N/A"
                              style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text Standardization Parameters */}
                    {step.type === 'text_standardization' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Text Operation</label>
                        <select
                          value={step.options?.operation || 'trim'}
                          onChange={(e) => handleUpdateStepOptions(step.id, { operation: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                        >
                          <option value="trim">Trim Whitespace</option>
                          <option value="lowercase">Convert to Lowercase</option>
                          <option value="uppercase">Convert to Uppercase</option>
                          <option value="titlecase">Convert to Title Case</option>
                        </select>
                      </div>
                    )}

                    {/* Type Cast Parameters */}
                    {step.type === 'type_cast' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Data Type</label>
                        <select
                          value={step.options?.targetType || 'numeric'}
                          onChange={(e) => handleUpdateStepOptions(step.id, { targetType: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                        >
                          <option value="numeric">Number (Clean Currency & Commas)</option>
                          <option value="date">Date (Standardize YYYY-MM-DD)</option>
                          <option value="boolean">Boolean (true / false)</option>
                          <option value="string">String (Text)</option>
                        </select>
                      </div>
                    )}

                    {/* Outlier Detection Parameters */}
                    {step.type === 'outlier_detection' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Statistical Method</label>
                          <select
                            value={step.options?.method || 'iqr'}
                            onChange={(e) => handleUpdateStepOptions(step.id, { method: e.target.value })}
                            style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                          >
                            <option value="iqr">IQR (Interquartile Range 1.5x)</option>
                            <option value="zscore">Z-Score (Std Dev &gt; 3.0)</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Action on Outlier</label>
                          <select
                            value={step.options?.action || 'filter'}
                            onChange={(e) => handleUpdateStepOptions(step.id, { action: e.target.value })}
                            style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.825rem' }}
                          >
                            <option value="filter">Filter / Drop Rows</option>
                            <option value="cap">Cap / Winsorize Bounds</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Diff Preview Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top KPI Quality Score Comparison Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Projected Quality Score */}
            <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                <span className="section-tag" style={{ color: afterScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                  Projected Quality Score
                </span>
                <ShieldCheck size={16} color={afterScore >= 80 ? 'var(--success)' : 'var(--warning)'} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 850 }}>
                  {afterScore}<span style={{ fontSize: '1.1rem', fontWeight: 600 }}>/100</span>
                </div>
                {scoreDiff !== 0 && (
                  <span className="status-pill active tabular-nums" style={{ fontSize: '0.75rem', background: scoreDiff > 0 ? 'var(--success-bg)' : 'var(--error-bg)', color: scoreDiff > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Original raw score: <strong className="tabular-nums">{beforeScore}/100</strong>
              </div>
            </div>

            {/* Row Impact */}
            <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                <span className="section-tag">Total Dimensions</span>
                <Table size={16} color="var(--accent-primary)" />
              </div>
              <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 850 }}>
                {previewResult?.after?.rowCount ?? (dataSource?.row_count || 0)}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Sample preview rows evaluated
              </div>
            </div>

            {/* Nulls Cleaned */}
            <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                <span className="section-tag">Missing Cells Remaining</span>
                <Activity size={16} color="var(--info)" />
              </div>
              <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 850, color: (previewResult?.after?.missingCount || 0) === 0 ? 'var(--success)' : 'var(--warning)' }}>
                {previewResult?.after?.missingCount ?? 0}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                From <strong className="tabular-nums">{previewResult?.before?.missingCount ?? 0}</strong> initial missing cells
              </div>
            </div>
          </div>

          {/* Tabular Preview Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTab('diff')}
                  className={`btn-ghost ${selectedPreviewTab === 'diff' ? 'active-tab' : ''}`}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.85rem',
                    borderBottom: selectedPreviewTab === 'diff' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: selectedPreviewTab === 'diff' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: selectedPreviewTab === 'diff' ? 700 : 500,
                  }}
                >
                  Transformed Output ({previewResult?.after?.sampleRows?.length || 0} rows)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreviewTab('original')}
                  className={`btn-ghost ${selectedPreviewTab === 'original' ? 'active-tab' : ''}`}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.85rem',
                    borderBottom: selectedPreviewTab === 'original' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: selectedPreviewTab === 'original' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: selectedPreviewTab === 'original' ? 700 : 500,
                  }}
                >
                  Raw Input ({previewResult?.before?.sampleRows?.length || 0} rows)
                </button>
              </div>

              {previewLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                  <RefreshCw size={12} className="pulse-glow" />
                  <span>Computing live dry-run...</span>
                </div>
              )}
            </div>

            {/* Table Render */}
            {(() => {
              const activeRows = selectedPreviewTab === 'original'
                ? previewResult?.before?.sampleRows || []
                : previewResult?.after?.sampleRows || [];

              if (activeRows.length === 0) {
                return (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No sample preview data available.
                  </div>
                );
              }

              const headers = Object.keys(activeRows[0] || {});

              return (
                <div className="table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} style={{ whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {headers.map((h, cIdx) => (
                            <td key={cIdx} className="tabular-nums" style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                              {row[h] === null || row[h] === undefined ? (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>
                              ) : (
                                String(row[h])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Operation Picker Modal */}
      {pickerModalOpen && (
        <div className="modal-backdrop" onClick={() => setPickerModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '90%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Add Cleansing Operation</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Select an automated transformation operator to append to your recipe pipeline.
                </p>
              </div>
              <button onClick={() => setPickerModalOpen(false)} className="btn-icon">
                &times;
              </button>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn-ghost ${selectedCategory === cat ? 'active-tab' : ''}`}
                  style={{
                    padding: '0.3rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    background: selectedCategory === cat ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    color: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === cat ? 700 : 500,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Operator Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {filteredOperations.map((op, idx) => {
                const IconComponent = op.icon || Wand2;
                return (
                  <div
                    key={idx}
                    onClick={() => handleAddOperation(op)}
                    data-testid={`select-op-${op.type}`}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div style={{ background: 'var(--accent-glow)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)' }}>
                          <IconComponent size={16} />
                        </div>
                        <span className="status-pill info" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          {op.requiredTier}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 750, marginBottom: '0.35rem' }}>{op.name}</h4>
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{op.description}</p>
                    </div>

                    <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Plus size={12} />
                      <span>Add to Recipe</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Package Quota / Feature Locked Modal */}
      <LimitReachedModal
        isOpen={quotaExceededModal.isOpen}
        onClose={() => setQuotaExceededModal((prev) => ({ ...prev, isOpen: false }))}
        limitType={quotaExceededModal.limitType}
        currentUsage={quotaExceededModal.currentUsage}
        maxLimit={quotaExceededModal.maxLimit}
      />
    </div>
  );
}
