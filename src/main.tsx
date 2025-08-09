import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import AppMinimal from './AppMinimal';

const root = document.getElementById('root');

if (root) {
  // Render the full app, but if it crashes, show the minimal app instead
  createRoot(root).render(
    <ErrorBoundary fallback={<AppMinimal />}>
      <App />
    </ErrorBoundary>
  );
}
