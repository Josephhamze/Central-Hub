import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ToastProvider } from '@contexts/ToastContext';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import App from './App';
import './styles/index.css';

// Polyfills for @react-pdf/renderer
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: true, // Refetch when window regains focus to get fresh data
      refetchOnMount: true, // Always refetch on mount to get fresh data from database
      staleTime: 0, // Data is immediately stale, always fetch from database
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes (for navigation) - renamed from cacheTime in v5
    },
    mutations: {
      onError: (error: any) => {
        // Only log unexpected errors in development
        if (import.meta.env.DEV && error?.response?.status !== 401 && error?.response?.status !== 403) {
          // eslint-disable-next-line no-console
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);


