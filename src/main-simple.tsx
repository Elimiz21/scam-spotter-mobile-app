import { createRoot } from 'react-dom/client';
import './index.css';

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>ScamShield App</h1>
      <p>Simple version - Testing if React works</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SimpleApp />);
}