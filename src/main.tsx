import { createRoot } from 'react-dom/client'
import './index.css'

const App = () => {
  console.log('App component rendering');
  return (
    <div style={{ padding: '20px', textAlign: 'center', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>ScamShield Working!</h1>
      <p>React is rendering successfully.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <button onClick={() => alert('Button clicked!')}>
        Test Button
      </button>
    </div>
  );
};

console.log('Script starting...');
const root = document.getElementById("root");
console.log('Root element:', root);

if (root) {
  console.log('Creating React root...');
  try {
    createRoot(root).render(<App />);
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Error mounting React app:', error);
  }
} else {
  console.error("Root element not found!");
  document.body.innerHTML = '<h1 style="color: red;">Error: Root element not found</h1>';
}