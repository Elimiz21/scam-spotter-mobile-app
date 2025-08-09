import { createRoot } from 'react-dom/client';

console.log('test-main.tsx loaded');

const root = document.getElementById('root');
console.log('Root element:', root);

if (root) {
  console.log('Creating React root...');
  try {
    createRoot(root).render(
      <div>
        <h1>Test React App</h1>
        <p>If you see this, React is working!</p>
      </div>
    );
    console.log('React rendered successfully');
  } catch (error) {
    console.error('Error rendering React:', error);
  }
} else {
  console.error('Root element not found!');
}