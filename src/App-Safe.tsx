import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Minimal safe version without problematic providers
const AppSafe = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ color: '#1a73e8', marginBottom: '20px' }}>ScamShield</h1>
              <p>Safe mode - App is running without theme providers</p>
              <nav style={{ marginTop: '20px' }}>
                <a href="/auth" style={{ marginRight: '20px' }}>Login</a>
                <a href="/check" style={{ marginRight: '20px' }}>Check</a>
                <a href="/pricing">Pricing</a>
              </nav>
            </div>
          } />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  </QueryClientProvider>
);

export default AppSafe;