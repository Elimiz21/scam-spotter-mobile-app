import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { SimpleThemeProvider } from "./components/SimpleThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import SEOHead from "./components/SEOHead";
import Home from "./pages/Home";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Test with ErrorBoundary, SimpleThemeProvider, AND AuthProvider
const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <SimpleThemeProvider>
      <AuthProvider>
        <SEOHead
          title="ScamShield - Advanced Scam Detection & Protection"
          description="Protect yourself from online scams with our AI-powered detection platform."
        />
        <BrowserRouter>
          <div style={{ minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>Login Page</h1>
                  <p>Auth system is working!</p>
                </div>
              } />
              <Route path="/check" element={
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>Check Page</h1>
                  <p>Single check functionality</p>
                </div>
              } />
              <Route path="*" element={
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>404 - Page not found</h1>
                </div>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </SimpleThemeProvider>
  </QueryClientProvider>
);

const AppSafe = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default AppSafe;