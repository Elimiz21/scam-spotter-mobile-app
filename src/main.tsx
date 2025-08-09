import { createRoot } from 'react-dom/client';
import './index.css';
import AppMinimal from './AppMinimal';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<AppMinimal />);
}
