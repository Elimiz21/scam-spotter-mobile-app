import './polyfills';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Direct render - no double mounting
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
  console.log('App loaded successfully');
} else {
  console.error('Root element not found');
}