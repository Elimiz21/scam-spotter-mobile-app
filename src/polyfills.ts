// Polyfills for browser compatibility
// This file should be imported at the very top of main.tsx

console.log('%c⚡ Polyfills loading...', 'color: blue; font-weight: bold');

// Import trace error first to catch everything
import './trace-error';
// Import error catcher for global errors
import './error-catcher';

// Check if Map and Set are available
if (typeof Map === 'undefined') {
  console.error('CRITICAL: Map is not defined! Browser may not support it.');
  // You could add a Map polyfill here if needed
} else {
  console.log('✅ Map is available');
}

if (typeof Set === 'undefined') {
  console.error('CRITICAL: Set is not defined! Browser may not support it.');
  // You could add a Set polyfill here if needed
} else {
  console.log('✅ Set is available');
}

// Ensure global is defined for libraries that expect it
if (typeof global === 'undefined') {
  (window as any).global = window;
  console.log('✅ Global polyfill applied');
}

// Ensure process is defined for libraries that expect it
if (typeof process === 'undefined') {
  (window as any).process = {
    env: {}
  };
  console.log('✅ Process polyfill applied');
}

console.log('%c✨ Polyfills loaded successfully', 'color: green; font-weight: bold');