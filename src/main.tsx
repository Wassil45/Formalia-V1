import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { supabase } from './lib/supabase';
import App from './App.tsx';
import './index.css';

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message ?? String(event.reason)
  
  if (message.includes('Failed to connect to MetaMask')) {
    event.preventDefault() // Suppress MetaMask error
    return
  }

  if (message.includes('Lock broken by another request with the \'steal\' option')) {
    event.preventDefault() // Suppress lock error overlay
    return
  }

  if (
    message.includes('Refresh Token Not Found') ||
    message.includes('Invalid Refresh Token') ||
    message.includes('JWT expired')
  ) {
    event.preventDefault() // Suppress console error
    console.warn('Session expired — redirecting to login')
    supabase.auth.signOut().then(() => {
      window.location.href = '/auth?reason=session_expired'
    })
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
