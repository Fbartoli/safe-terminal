import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createSafeClient } from '@safe-global/sdk-starter-kit';
import { useAddress, useRpcUrl } from '../context/AppContext.js';

// Safe-related query keys
export const safeKeys = {
  all: ['safe'] as const,
  details: (address: string, rpcUrl: string) => [...safeKeys.all, 'details', address, rpcUrl] as const,
  owners: (address: string, rpcUrl: string) => [...safeKeys.all, 'owners', address, rpcUrl] as const,
  threshold: (address: string, rpcUrl: string) => [...safeKeys.all, 'threshold', address, rpcUrl] as const,
  nonce: (address: string, rpcUrl: string) => [...safeKeys.all, 'nonce', address, rpcUrl] as const,
  version: (address: string, rpcUrl: string) => [...safeKeys.all, 'version', address, rpcUrl] as const,
  deployment: (address: string, rpcUrl: string) => [...safeKeys.all, 'deployment', address, rpcUrl] as const,
};

interface SafeDetails {
  owners: string[];
  threshold: number;
  nonce: number;
  isDeployed: boolean;
  version: string;
}

// Fetch complete Safe details
async function fetchSafeDetails(address: string, rpcUrl: string): Promise<SafeDetails> {
  try {
    const safeClient = await createSafeClient({
      provider: rpcUrl,
      safeAddress: address
    });

    // Fetch all data in parallel
    const [owners, threshold, nonce, isDeployed, version] = await Promise.all([
      safeClient.getOwners(),
      safeClient.getThreshold(),
      safeClient.getNonce(),
      safeClient.isDeployed(),
      safeClient.protocolKit.getContractVersion()
    ]);

    return {
      owners,
      threshold: Number(threshold),
      nonce: Number(nonce),
      isDeployed,
      version
    };
  } catch (error) {
    throw new Error(`Failed to fetch Safe details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fetch individual Safe properties for more granular caching
async function fetchSafeOwners(address: string, rpcUrl: string): Promise<string[]> {
  const safeClient = await createSafeClient({
    provider: rpcUrl,
    safeAddress: address
  });
  return safeClient.getOwners();
}

async function fetchSafeThreshold(address: string, rpcUrl: string): Promise<number> {
  const safeClient = await createSafeClient({
    provider: rpcUrl,
    safeAddress: address
  });
  const threshold = await safeClient.getThreshold();
  return Number(threshold);
}

async function fetchSafeNonce(address: string, rpcUrl: string): Promise<number> {
  const safeClient = await createSafeClient({
    provider: rpcUrl,
    safeAddress: address
  });
  const nonce = await safeClient.getNonce();
  return Number(nonce);
}

async function fetchSafeDeployment(address: string, rpcUrl: string): Promise<boolean> {
  const safeClient = await createSafeClient({
    provider: rpcUrl,
    safeAddress: address
  });
  return safeClient.isDeployed();
}

async function fetchSafeVersion(address: string, rpcUrl: string): Promise<string> {
  const safeClient = await createSafeClient({
    provider: rpcUrl,
    safeAddress: address
  });
  return safeClient.protocolKit.getContractVersion();
}

// Custom hooks
export function useSafeDetails() {
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: safeKeys.details(address || '', rpcUrl || ''),
    queryFn: () => fetchSafeDetails(address!, rpcUrl!),
    enabled: !!address && !!rpcUrl,
    staleTime: 30 * 1000, // 30 seconds - Safe config doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSafeOwners() {
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: safeKeys.owners(address || '', rpcUrl || ''),
    queryFn: () => fetchSafeOwners(address!, rpcUrl!),
    enabled: !!address && !!rpcUrl,
    staleTime: 60 * 1000, // 1 minute - owners change rarely
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useSafeThreshold() {
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: safeKeys.threshold(address || '', rpcUrl || ''),
    queryFn: () => fetchSafeThreshold(address!, rpcUrl!),
    enabled: !!address && !!rpcUrl,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useSafeNonce() {
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: safeKeys.nonce(address || '', rpcUrl || ''),
    queryFn: () => fetchSafeNonce(address!, rpcUrl!),
    enabled: !!address && !!rpcUrl,
    staleTime: 10 * 1000, // 10 seconds - nonce changes with each transaction
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSafeDeployment() {
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: safeKeys.deployment(address || '', rpcUrl || ''),
    queryFn: () => fetchSafeDeployment(address!, rpcUrl!),
    enabled: !!address && !!rpcUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes - deployment status rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSafeVersion() {
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  
  return useQuery({
    queryKey: safeKeys.version(address || '', rpcUrl || ''),
    queryFn: () => fetchSafeVersion(address!, rpcUrl!),
    enabled: !!address && !!rpcUrl,
    staleTime: 60 * 60 * 1000, // 1 hour - version never changes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Utility hook to invalidate all Safe queries
export function useInvalidateSafe() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: safeKeys.all });
  };
}

// Prefetch Safe data (useful for preloading)
export function usePrefetchSafe() {
  const queryClient = useQueryClient();
  
  return (address: string, rpcUrl: string) => {
    queryClient.prefetchQuery({
      queryKey: safeKeys.details(address, rpcUrl),
      queryFn: () => fetchSafeDetails(address, rpcUrl),
      staleTime: 30 * 1000,
    });
  };
}
