import './debug-wrapper';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Simple working component first
const WorkingApp = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadFullApp = async () => {
    setLoading(true);
    try {
      // Load the full app with fixed ThemeProvider
      const { default: App } = await import('./App');
      const { default: ErrorBoundary } = await import('./components/ErrorBoundary');
      
      const root = document.getElementById('root');
      if (root) {
        createRoot(root).render(
          <ErrorBoundary fallback={<WorkingApp />}>
            <App />
          </ErrorBoundary>
        );
      }
    } catch (err) {
      setError(`Failed to load app: ${err}`);
      console.error('Error loading full app:', err);
      setLoading(false);
    }
  };

  // Auto-load the full app after a short delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadFullApp();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a73e8' }}>ScamShield</h1>
      
      <div style={{ background: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Welcome to ScamShield</h2>
        <p>Advanced Scam Detection & Protection Platform</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading application...</p>
        </div>
      )}

      {error && (
        <div style={{ background: '#ffebee', padding: '20px', borderRadius: '8px', marginBottom: '20px', color: '#c62828' }}>
          <strong>Error:</strong> {error}
          <br />
          <button
            onClick={() => {
              setError(null);
              loadFullApp();
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Quick Links</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
          <a href="/auth" style={{ padding: '8px 16px', background: 'white', borderRadius: '4px', textDecoration: 'none', color: '#1a73e8' }}>Login</a>
          <a href="/check" style={{ padding: '8px 16px', background: 'white', borderRadius: '4px', textDecoration: 'none', color: '#1a73e8' }}>Single Check</a>
          <a href="/analyze" style={{ padding: '8px 16px', background: 'white', borderRadius: '4px', textDecoration: 'none', color: '#1a73e8' }}>Group Analysis</a>
          <a href="/pricing" style={{ padding: '8px 16px', background: 'white', borderRadius: '4px', textDecoration: 'none', color: '#1a73e8' }}>Pricing</a>
        </div>
      </div>
    </div>
  );
};

// Initialize the app
const root = document.getElementById('root');
if (root) {
  try {
    console.log('Initializing ScamShield app...');
    createRoot(root).render(<WorkingApp />);
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center;">
        <h1>Error Loading Application</h1>
        <p>${error}</p>
        <p>Please refresh the page or contact support.</p>
      </div>
    `;
  }
} else {
  console.error('Root element not found');
}