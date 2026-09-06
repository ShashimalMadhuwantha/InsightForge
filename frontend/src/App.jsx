import { HealthStatusView } from './features/system/HealthStatusView';
import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

export function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1rem 2rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <BarChart3 size={22} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                InsightForge
              </span>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                v1.0.0 Alpha
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--success)" />
              Multi-Tenant Architecture
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '680px', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
            <Sparkles size={14} />
            <span>Multi-Tenant Business Intelligence & Automated Insights</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            Core Infrastructure Status
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Verifying end-to-end communication across Express.js API, PostgreSQL multi-tenant database, and Redis background queues.
          </p>
        </div>

        {/* Live System Health Component */}
        <HealthStatusView />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
      }}>
        InsightForge Platform &copy; 2026. Built with React, Vite, Express, PostgreSQL, and Redis.
      </footer>
    </div>
  );
}

export default App;
