# TanStack Query Integration Examples

## Overview

This document demonstrates how the new TanStack Query integration improves state management in your Ink CLI application.

## Key Benefits

### 1. **Automatic Caching & Background Updates**
```typescript
// Before: Manual polling with useEffect
useEffect(() => {
  const interval = setInterval(async () => {
    const block = await publicClient.getBlockNumber();
    setCurrentBlock(Number(block));
  }, 12000);
  return () => clearInterval(interval);
}, [publicClient]);

// After: Automatic with TanStack Query
const { data: currentBlock } = useBlockNumber(); // Auto-refreshes every 12s
```

### 2. **Smart Error Handling & Retries**
```typescript
// Before: Manual error handling
const [error, setError] = useState<string | null>(null);
try {
  const data = await fetchSafeData();
  setSafeData(data);
} catch (err) {
  setError(err.message);
  // Manual retry logic needed
}

// After: Built-in error handling
const { data, error, isLoading, refetch } = useSafeDetails();
// Automatic retries, exponential backoff, error boundaries
```

### 3. **Optimistic Updates & Mutations**
```typescript
// Example: Update Safe threshold with optimistic updates
const updateThresholdMutation = useMutation({
  mutationFn: async (newThreshold: number) => {
    const safeClient = await createSafeClient({
      provider: rpcUrl!,
      safeAddress: address!
    });
    return safeClient.updateThreshold(newThreshold);
  },
  onMutate: async (newThreshold) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: safeKeys.threshold(address!, rpcUrl!) });
    
    // Snapshot previous value
    const previousThreshold = queryClient.getQueryData(safeKeys.threshold(address!, rpcUrl!));
    
    // Optimistically update
    queryClient.setQueryData(safeKeys.threshold(address!, rpcUrl!), newThreshold);
    
    return { previousThreshold };
  },
  onError: (err, newThreshold, context) => {
    // Rollback on error
    queryClient.setQueryData(
      safeKeys.threshold(address!, rpcUrl!), 
      context?.previousThreshold
    );
  },
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: safeKeys.all });
  }
});
```

### 4. **Granular Data Fetching**
```typescript
// Before: Fetch all Safe data together
const { safeInfo, isLoading, error } = useSafe(); // Everything or nothing

// After: Fetch only what you need
const { data: owners } = useSafeOwners();        // Only owners
const { data: threshold } = useSafeThreshold();  // Only threshold  
const { data: nonce } = useSafeNonce();          // Only nonce

// Or fetch everything if needed
const { data: allSafeData } = useSafeDetails();  // Complete data
```

### 5. **Smart Caching Strategy**
```typescript
// Different cache times for different data types
const blockchainKeys = {
  chainId: 5 * 60 * 1000,    // 5 min - rarely changes
  blockNumber: 10 * 1000,    // 10 sec - changes frequently  
  safeOwners: 60 * 1000,     // 1 min - changes rarely
  safeNonce: 10 * 1000,      // 10 sec - changes with transactions
  rpcHealth: 15 * 1000,      // 15 sec - monitor connection
};
```

## Usage Patterns

### 1. **Component-Level Data Fetching**
```typescript
// components/SafeDetails.tsx
export default function SafeDetails() {
  const { data: safeInfo, isLoading, error } = useSafeDetails();
  const { data: rpcHealth } = useRpcHealth();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <Box>
      <SafeInfo data={safeInfo} />
      <ConnectionStatus health={rpcHealth} />
    </Box>
  );
}
```

### 2. **Global State Synchronization**
```typescript
// The beauty: No need to manually sync server state!
// TanStack Query handles it automatically across components

// Component A
const { data: chainId } = useChainId();

// Component B (different part of app)  
const { data: chainId } = useChainId(); // Same data, shared cache!
```

### 3. **Prefetching for Better UX**
```typescript
// hooks/useSafeData.ts
export function usePrefetchSafe() {
  const queryClient = useQueryClient();
  
  return (address: string, rpcUrl: string) => {
    queryClient.prefetchQuery({
      queryKey: safeKeys.details(address, rpcUrl),
      queryFn: () => fetchSafeDetails(address, rpcUrl),
    });
  };
}

// Usage: Prefetch when user hovers over address input
const prefetchSafe = usePrefetchSafe();
<AddressInput 
  onFocus={(address) => prefetchSafe(address, rpcUrl)} 
/>
```

### 4. **Background Sync & Real-time Updates**
```typescript
// Automatic background refetching
const { data: currentBlock } = useBlockNumber(); // Refetches every 12s
const { data: rpcHealth } = useRpcHealth();      // Refetches every 30s

// Manual refresh for user-triggered updates
const invalidateSafe = useInvalidateSafe();
const handleRefresh = () => invalidateSafe(); // Refresh all Safe data
```

## Migration Benefits

### Before (Complex State Management)
- 360 lines in AppContext.tsx
- Multiple useEffect hooks with dependencies
- Manual polling and cleanup
- Complex error handling
- Prop drilling for loading states
- Manual cache invalidation

### After (TanStack Query)
- Simplified context (UI state only)
- Declarative data fetching
- Automatic background sync
- Built-in error handling & retries
- Component-level loading states
- Smart caching & invalidation

## Performance Improvements

1. **Reduced Bundle Size**: Removed complex polling logic
2. **Better Caching**: Intelligent cache management
3. **Background Updates**: Non-blocking data refresh
4. **Request Deduplication**: Multiple components, single request
5. **Stale-While-Revalidate**: Show cached data while fetching fresh data

## Best Practices

1. **Use Specific Hooks**: Prefer `useSafeOwners()` over `useSafeDetails()` when you only need owners
2. **Optimize Stale Times**: Set longer stale times for data that changes rarely
3. **Handle Loading States**: Always handle `isLoading` and `error` states
4. **Prefetch Strategically**: Prefetch data the user is likely to need
5. **Invalidate Wisely**: Use specific invalidation over blanket `invalidateQueries()`

This integration transforms your CLI from a simple state management setup to a robust, production-ready application with enterprise-level data fetching capabilities!
