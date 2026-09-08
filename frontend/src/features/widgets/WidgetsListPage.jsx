import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Plus,
  Search,
  Trash2,
  Edit2,
  Layers,
  Database,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { widgetService } from '../../services/widgetService';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
  { id: 'pie', label: 'Pie' },
  { id: 'donut', label: 'Donut' },
  { id: 'kpi', label: 'KPI' },
  { id: 'table', label: 'Table' },
  { id: 'scatter', label: 'Scatter' },
];

export function WidgetsListPage() {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadWidgets();
  }, [selectedType]);

  async function loadWidgets() {
    setLoading(true);
    try {
      const params = {
        limit: 100,
        type: selectedType === 'all' ? undefined : selectedType,
      };
      const res = await widgetService.getWidgets(params);
      setWidgets(res.data || []);
    } catch (err) {
      console.error('Failed to load widgets', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteWidget = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete widget "${title}"?`)) return;

    setDeletingId(id);
    try {
      await widgetService.deleteWidget(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete widget');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredWidgets = widgets.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.title?.toLowerCase().includes(q) ||
      w.description?.toLowerCase().includes(q) ||
      w.data_source_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 850, letterSpacing: '-0.03em', margin: 0 }}>
            Visual Widgets & Charts
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            Build, customize, and manage charts and KPI metrics across all connected datasets.
          </p>
        </div>

        <button
          onClick={() => navigate('/widgets/new')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Widget</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map((tf) => {
            const isSelected = selectedType === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => setSelectedType(tf.id)}
                className="btn btn-ghost"
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--accent-glow-subtle)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isSelected
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets..."
            className="form-control"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Widget Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading widgets inventory...
        </div>
      ) : filteredWidgets.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '64px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <BarChart3 size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>No widgets found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', maxWidth: '420px' }}>
              Create your first visual chart or KPI card from an uploaded dataset to start building dashboards.
            </p>
          </div>
          <button
            onClick={() => navigate('/widgets/new')}
            className="btn btn-primary"
            style={{ marginTop: '8px' }}
          >
            Create Widget
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredWidgets.map((w) => {
            return (
              <div
                key={w.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card-highlight)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--accent-primary)',
                        display: 'inline-block',
                        marginBottom: '4px',
                      }}
                    >
                      {w.type} chart
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 750, margin: 0, color: 'var(--text-primary)' }}>
                      {w.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => navigate(`/widgets/${w.id}/edit`)}
                      className="btn-icon"
                      title="Edit widget"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(w.id, w.title)}
                      disabled={deletingId === w.id}
                      className="btn-icon"
                      style={{ color: 'var(--error)' }}
                      title="Delete widget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Metadata details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={13} color="var(--text-muted)" />
                    <span>{w.data_source_name || 'Unknown dataset'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    <span>Created {new Date(w.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => navigate(`/widgets/${w.id}/edit`)}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.82rem', padding: '5px 12px' }}
                  >
                    Open Studio →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
