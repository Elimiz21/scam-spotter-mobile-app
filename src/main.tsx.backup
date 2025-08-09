import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import AppMinimal from './AppMinimal';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <ErrorBoundary fallback={<AppMinimal />}>
      <App />
    </ErrorBoundary>
  );
}
