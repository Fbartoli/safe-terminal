import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { createPublicClient, http, PublicClient } from 'viem';
import { useRpcUrl } from '../context/AppContext.js';

// Query keys for better organization and type safety
export const blockchainKeys = {
  all: ['blockchain'] as const,
  client: (rpcUrl: string) => [...blockchainKeys.all, 'client', rpcUrl] as const,
  chainId: (rpcUrl: string) => [...blockchainKeys.all, 'chainId', rpcUrl] as const,
  blockNumber: (rpcUrl: string) => [...blockchainKeys.all, 'blockNumber', rpcUrl] as const,
  health: (rpcUrl: string) => [...blockchainKeys.all, 'health', rpcUrl] as const,
};

// Create public client with error handling
async function createSafePublicClient(rpcUrl: string): Promise<PublicClient> {
  try {
    const client = createPublicClient({
      transport: http(rpcUrl, {
        timeout: 10000, // 10 second timeout
        retryCount: 2,
      }),
    });
    
    // Test the connection by fetching chain ID
    await client.getChainId();
    return client;
  } catch (error) {
    throw new Error(`Failed to connect to RPC: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fetch chain ID
async function fetchChainId(rpcUrl: string): Promise<number> {
  const client = await createSafePublicClient(rpcUrl);
  return client.getChainId();
}

// Fetch current block number
async function fetchBlockNumber(rpcUrl: string): Promise<bigint> {
  const client = await createSafePublicClient(rpcUrl);
  return client.getBlockNumber();
}

// RPC health check
async function checkRpcHealth(rpcUrl: string): Promise<{ healthy: boolean; latency: number }> {
  const startTime = Date.now();
  try {
    await createSafePublicClient(rpcUrl);
    const latency = Date.now() - startTime;
    return { healthy: true, latency };
  } catch (error) {
    return { healthy: false, latency: Date.now() - startTime };
  }
}

// Custom hooks using TanStack Query
export function usePublicClient(): UseQueryResult<PublicClient, Error> {
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: blockchainKeys.client(rpcUrl || ''),
    queryFn: () => createSafePublicClient(rpcUrl!),
    enabled: !!rpcUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes - client doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useChainId(): UseQueryResult<number, Error> {
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: blockchainKeys.chainId(rpcUrl || ''),
    queryFn: () => fetchChainId(rpcUrl!),
    enabled: !!rpcUrl,
    staleTime: 5 * 60 * 1000, // Chain ID rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useBlockNumber(): UseQueryResult<bigint, Error> {
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: blockchainKeys.blockNumber(rpcUrl || ''),
    queryFn: () => fetchBlockNumber(rpcUrl!),
    enabled: !!rpcUrl,
    refetchInterval: 12000, // Refetch every 12 seconds (typical block time)
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useRpcHealth(): UseQueryResult<{ healthy: boolean; latency: number }, Error> {
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: blockchainKeys.health(rpcUrl || ''),
    queryFn: () => checkRpcHealth(rpcUrl!),
    enabled: !!rpcUrl,
    refetchInterval: 30000, // Check health every 30 seconds
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Utility hook to invalidate all blockchain queries
export function useInvalidateBlockchain() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: blockchainKeys.all });
  };
}
