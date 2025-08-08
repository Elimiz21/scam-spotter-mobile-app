import { createRoot } from 'react-dom/client'
// import App from './App.tsx'
import App from './AppMinimal.tsx'
import './index.css'

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("Root element not found!");
}
