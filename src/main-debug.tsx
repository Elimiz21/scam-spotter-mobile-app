console.log('main-debug.tsx: Script starting');

import { createRoot } from 'react-dom/client';
import './index.css';

console.log('main-debug.tsx: Imports complete');

// Wait for DOM to be ready
function initApp() {
  console.log('main-debug.tsx: DOM ready, initializing app');
  
  const root = document.getElementById('root');
  console.log('main-debug.tsx: Root element:', root);
  
  if (!root) {
    console.error('main-debug.tsx: Root element not found!');
    document.body.innerHTML = '<h1 style="color: red;">Error: Root element not found</h1>';
    return;
  }
  
  try {
    console.log('main-debug.tsx: Creating React root...');
    const reactRoot = createRoot(root);
    
    console.log('main-debug.tsx: Rendering React app...');
    reactRoot.render(
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>ScamShield Debug Mode</h1>
        <p>React is working! Time: {new Date().toISOString()}</p>
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
          <h2>Debug Info:</h2>
          <ul>
            <li>React Version: 18.3.1</li>
            <li>Vite Dev Server: Active</li>
            <li>Port: 8080</li>
          </ul>
        </div>
      </div>
    );
    
    console.log('main-debug.tsx: React rendered successfully!');
  } catch (error) {
    console.error('main-debug.tsx: Error rendering React:', error);
    document.body.innerHTML = `<h1 style="color: red;">React Error: ${error}</h1>`;
  }
}

// Make sure DOM is loaded
if (document.readyState === 'loading') {
  console.log('main-debug.tsx: Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  console.log('main-debug.tsx: DOM already ready');
  initApp();
}

console.log('main-debug.tsx: Script end');