// Global error catcher to find the exact source
window.addEventListener('error', (event) => {
  console.error('🔴 GLOBAL ERROR CAUGHT:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
  
  // Check if it's the undefined.add error
  if (event.message && event.message.includes('add')) {
    console.error('🎯 THIS IS THE ADD ERROR!');
    console.trace();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
});

// Override console.error to catch all errors
const originalError = console.error;
console.error = function(...args) {
  console.log('🔍 Console.error called with:', ...args);
  if (args[0] && typeof args[0] === 'string' && args[0].includes('add')) {
    console.trace('Stack trace for add error:');
  }
  return originalError.apply(console, args);
};

console.log('🛡️ Error catcher installed');

export {};