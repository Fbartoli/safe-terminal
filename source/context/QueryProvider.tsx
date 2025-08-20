import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure the query client with optimized settings for CLI usage
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce background refetch for CLI apps
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Reasonable stale times for blockchain data
      staleTime: 5 * 1000, // 5 seconds - blockchain data changes frequently
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on certain errors
        if (error instanceof Error && error.message.includes('Invalid')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
