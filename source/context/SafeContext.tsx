import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createSafeClient, SafeClient } from '@safe-global/sdk-starter-kit';
import { useBlockchain, useAddress, useRpcUrl } from './AppContext.js';

interface SafeInfo {
  owners: string[];
  threshold: number;
  nonce: number;
  isDeployed: boolean;
  isInitialized: boolean;
  version: string;
}

interface SafeContextType {
  safeInfo: SafeInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const SafeContext = createContext<SafeContextType | undefined>(undefined);

export function SafeProvider({ children }: { children: React.ReactNode }) {
  const { publicClient } = useBlockchain();
  const { address } = useAddress();
  const { rpcUrl } = useRpcUrl();
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchId, setFetchId] = useState(0);
  
  // Use refs to track previous values for comparison
  const prevAddressRef = useRef<string | undefined>(undefined);
  const prevRpcUrlRef = useRef<string | undefined>(undefined);

  const refetch = () => {
    setFetchId(prev => prev + 1);
  };

  useEffect(() => {
    // Only fetch if address or rpcUrl has changed
    const addressChanged = prevAddressRef.current !== address;
    const rpcUrlChanged = prevRpcUrlRef.current !== rpcUrl;
    
    // Update refs
    prevAddressRef.current = address;
    prevRpcUrlRef.current = rpcUrl;
    
    if (!addressChanged && !rpcUrlChanged && safeInfo !== null) {
      return; // Skip fetch if nothing changed and we already have data
    }

    const fetchSafeDetails = async () => {
      if (!publicClient || !address || !rpcUrl) {
        setError('Public client, address, or RPC URL not available');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const safeClient = await createSafeClient({
          provider: rpcUrl,
          safeAddress: address
        });

        // Fetch Safe information
        const [owners, threshold, nonce, isDeployed, version] = await Promise.all([
          safeClient.getOwners(),
          safeClient.getThreshold(),
          safeClient.getNonce(),
          safeClient.isDeployed(),
          safeClient.protocolKit.getContractVersion()
        ]);

        setSafeInfo({
          owners,
          threshold: Number(threshold),
          nonce: Number(nonce),
          isDeployed: isDeployed,
          isInitialized: true,
          version: version
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Safe details');
        setSafeInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSafeDetails();
  }, [publicClient, address, rpcUrl, fetchId, SafeClient]); // Include fetchId to allow manual refetching

  return (
    <SafeContext.Provider value={{ safeInfo, isLoading, error, refetch }}>
      {children}
    </SafeContext.Provider>
  );
}

export function useSafe() {
  const context = useContext(SafeContext);
  if (context === undefined) {
    throw new Error('useSafe must be used within a SafeProvider');
  }
  return context;
} 