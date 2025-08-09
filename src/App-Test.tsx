import React from 'react';

// Test 1: Just React
export const Test1 = () => <div>Test 1: Basic React Works</div>;

// Test 2: Add ErrorBoundary
import ErrorBoundary from "./components/ErrorBoundary";
export const Test2 = () => (
  <ErrorBoundary>
    <div>Test 2: With ErrorBoundary</div>
  </ErrorBoundary>
);

// Test 3: Add QueryClient
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
export const Test3 = () => (
  <QueryClientProvider client={queryClient}>
    <div>Test 3: With QueryClient</div>
  </QueryClientProvider>
);

// Test 4: Add BrowserRouter
import { BrowserRouter } from "react-router-dom";
export const Test4 = () => (
  <BrowserRouter>
    <div>Test 4: With Router</div>
  </BrowserRouter>
);

// Test 5: Add useThemeStore
import { useThemeStore } from './lib/designSystem';
export const Test5 = () => {
  console.log('Test5: About to call useThemeStore');
  try {
    const store = useThemeStore();
    console.log('Test5: Store returned:', store);
    return <div>Test 5: With Theme Store - {store ? 'Store exists' : 'Store is null'}</div>;
  } catch (e) {
    console.error('Test5 Error:', e);
    return <div>Test 5 Error: {String(e)}</div>;
  }
};

// Test 6: Add ThemeProvider
import { ThemeProvider } from "./components/ThemeProvider";
export const Test6 = () => {
  console.log('Test6: About to render ThemeProvider');
  return (
    <ThemeProvider>
      <div>Test 6: With ThemeProvider</div>
    </ThemeProvider>
  );
};

// Test 7: Add AuthProvider
import { AuthProvider } from "./hooks/useAuth";
export const Test7 = () => (
  <AuthProvider>
    <div>Test 7: With AuthProvider</div>
  </AuthProvider>
);

// Main test component
const AppTest = () => {
  const [currentTest, setCurrentTest] = React.useState(1);
  
  const tests = [
    Test1,
    Test2,
    Test3,
    Test4,
    Test5,
    Test6,
    Test7
  ];
  
  const TestComponent = tests[currentTest - 1];
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Error Isolation Test</h1>
      <div style={{ marginBottom: '20px' }}>
        {[1,2,3,4,5,6,7].map(n => (
          <button 
            key={n}
            onClick={() => setCurrentTest(n)}
            style={{ 
              marginRight: '10px', 
              padding: '5px 10px',
              background: currentTest === n ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Test {n}
          </button>
        ))}
      </div>
      <div style={{ border: '2px solid #ccc', padding: '20px', marginTop: '20px' }}>
        <TestComponent />
      </div>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Open browser console to see detailed logs
      </div>
    </div>
  );
};

export default AppTest;