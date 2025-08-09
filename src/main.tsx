import './polyfills';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

console.log('%c🎯 Main.tsx starting...', 'color: purple; font-weight: bold');

// Direct render - no double mounting
const root = document.getElementById('root');
if (root) {
  console.log('%c🎯 Rendering App...', 'color: purple; font-weight: bold');
  try {
    createRoot(root).render(<App />);
    console.log('%c✅ App rendered successfully', 'color: green; font-weight: bold');
  } catch (error) {
    console.error('❌ Failed to render App:', error);
  }
} else {
  console.error('Root element not found');
}