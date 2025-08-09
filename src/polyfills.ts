// Polyfills for browser compatibility
// This file should be imported at the very top of main.tsx

// Check if Map and Set are available
if (typeof Map === 'undefined') {
  console.error('Map is not defined! Browser may not support it.');
  // You could add a Map polyfill here if needed
}

if (typeof Set === 'undefined') {
  console.error('Set is not defined! Browser may not support it.');
  // You could add a Set polyfill here if needed
}

// Ensure global is defined for libraries that expect it
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Ensure process is defined for libraries that expect it
if (typeof process === 'undefined') {
  (window as any).process = {
    env: {}
  };
}

console.log('Polyfills loaded');