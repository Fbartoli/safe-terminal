import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { PublicClient, createPublicClient, http, isAddress } from 'viem';

// Define the state shape
interface AppState {
  activeTab: number;
  ethereumAddress?: string;
  rpcURL?: string;
  chainId?: number;
  currentBlock?: number;
  isPolling: boolean;
  isSettingAddress: boolean;
  isSettingRpcUrl: boolean;
  refreshKey: number;
  publicClient?: PublicClient;
}

// Initial state
const initialState: AppState = {
  activeTab: 0,
  ethereumAddress: undefined,
  rpcURL: undefined,
  chainId: undefined,
  currentBlock: undefined,
  isPolling: false,
  isSettingAddress: false,
  isSettingRpcUrl: false,
  refreshKey: 0,
  publicClient: undefined
};

// Define action types
type Action =
  | { type: 'SET_ACTIVE_TAB'; payload: number }
  | { type: 'SET_ETHEREUM_ADDRESS'; payload: string }
  | { type: 'SET_RPC_URL'; payload: string }
  | { type: 'SET_CHAIN_ID'; payload: number }
  | { type: 'SET_CURRENT_BLOCK'; payload: number }
  | { type: 'SET_IS_POLLING'; payload: boolean }
  | { type: 'SET_IS_SETTING_ADDRESS'; payload: boolean }
  | { type: 'SET_IS_SETTING_RPC_URL'; payload: boolean }
  | { type: 'INCREMENT_REFRESH_KEY' }
  | { type: 'SET_PUBLIC_CLIENT'; payload: PublicClient | undefined }
  | { type: 'INITIALIZE'; payload: { address?: string; rpcUrl?: string } };

// Reducer function
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ETHEREUM_ADDRESS':
      return { ...state, ethereumAddress: action.payload, isSettingAddress: false };
    case 'SET_RPC_URL':
      return { ...state, rpcURL: action.payload };
    case 'SET_CHAIN_ID':
      return { ...state, chainId: action.payload };
    case 'SET_CURRENT_BLOCK':
      return { ...state, currentBlock: action.payload };
    case 'SET_IS_POLLING':
      return { ...state, isPolling: action.payload };
    case 'SET_IS_SETTING_ADDRESS':
      return { ...state, isSettingAddress: action.payload };
    case 'SET_IS_SETTING_RPC_URL':
      return { ...state, isSettingRpcUrl: action.payload };
    case 'INCREMENT_REFRESH_KEY':
      return { ...state, refreshKey: state.refreshKey + 1 };
    case 'SET_PUBLIC_CLIENT':
      return { ...state, publicClient: action.payload };
    case 'INITIALIZE':
      const updates: Partial<AppState> = {};
      if (action.payload.address && isAddress(action.payload.address)) {
        updates.ethereumAddress = action.payload.address;
      }
      if (action.payload.rpcUrl) {
        try {
          new URL(action.payload.rpcUrl);
          updates.rpcURL = action.payload.rpcUrl;
        } catch (error) {
          console.error('Invalid RPC URL provided:', error);
        }
      }
      return { ...state, ...updates };
    default:
      return state;
  }
}

// Create context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
  initialAddress?: string;
  initialRpcUrl?: string;
}

export function AppProvider({ children, initialAddress, initialRpcUrl }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize with CLI arguments if provided
  useEffect(() => {
    if (initialAddress || initialRpcUrl) {
      dispatch({
        type: 'INITIALIZE',
        payload: { address: initialAddress, rpcUrl: initialRpcUrl }
      });
    }
  }, [initialAddress, initialRpcUrl]);

  // Set up the public client when RPC URL is available
  useEffect(() => {
    if (!state.rpcURL) return;

    try {
      const client = createPublicClient({
        transport: http(state.rpcURL),
      });
      
      dispatch({ type: 'SET_PUBLIC_CLIENT', payload: client });
    } catch (error) {
      console.error('Failed to create public client:', error);
    }
  }, [state.rpcURL]);

  // Watch for new blocks using viem's watchBlockNumber
  useEffect(() => {
    if (!state.publicClient) return;

    dispatch({ type: 'SET_IS_POLLING', payload: true });
    
    // Use watchBlockNumber to subscribe to new blocks
    const unwatch = state.publicClient.watchBlockNumber({ 
      onBlockNumber: blockNumber => {
        dispatch({ type: 'SET_CURRENT_BLOCK', payload: Number(blockNumber) });
      }
    });
    
    // Initial block fetch
    const fetchInitialBlock = async () => {
      if (!state.publicClient) return;
      
      try {
        const blockNumber = await state.publicClient.getBlockNumber();
        const chainId = await state.publicClient.getChainId();
        dispatch({ type: 'SET_CURRENT_BLOCK', payload: Number(blockNumber) });
        dispatch({ type: 'SET_CHAIN_ID', payload: chainId });
      } catch (error) {
        console.error('Failed to fetch initial block:', error);
      }
    };
    
    fetchInitialBlock();
    
    // Clean up the subscription when component unmounts or RPC URL changes
    return () => {
      unwatch();
      dispatch({ type: 'SET_IS_POLLING', payload: false });
    };
  }, [state.publicClient]);

  const value = { state, dispatch };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook for using the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Custom hooks for specific actions
export function useTab() {
  const { state, dispatch } = useAppContext();
  
  return {
    activeTab: state.activeTab,
    setActiveTab: (tabIndex: number) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tabIndex }),
    tabs: ['Dashboard', 'Transaction', 'WalletConnect', 'Settings']
  };
}

export function useAddress() {
  const { state, dispatch } = useAppContext();
  
  return {
    address: state.ethereumAddress,
    isSettingAddress: state.isSettingAddress,
    setAddress: (address: string) => dispatch({ type: 'SET_ETHEREUM_ADDRESS', payload: address }),
    startChangingAddress: () => dispatch({ type: 'SET_IS_SETTING_ADDRESS', payload: true }),
    cancelChangingAddress: () => dispatch({ type: 'SET_IS_SETTING_ADDRESS', payload: false })
  };
}

export function useRpcUrl() {
  const { state, dispatch } = useAppContext();
  
  return {
    rpcUrl: state.rpcURL,
    chainId: state.chainId,
    isSettingRpcUrl: state.isSettingRpcUrl,
    setRpcUrl: (url: string, chainId: number) => {
      dispatch({ type: 'SET_RPC_URL', payload: url });
      dispatch({ type: 'SET_CHAIN_ID', payload: chainId });
      dispatch({ type: 'SET_IS_SETTING_RPC_URL', payload: false });
    },
    startChangingRpcUrl: () => dispatch({ type: 'SET_IS_SETTING_RPC_URL', payload: true }),
    cancelChangingRpcUrl: () => dispatch({ type: 'SET_IS_SETTING_RPC_URL', payload: false })
  };
}

// Add return type for useBlockchain
interface BlockchainState {
  currentBlock?: number;
  chainId?: number;
  isPolling: boolean;
  publicClient?: PublicClient;
}

export function useBlockchain(): BlockchainState {
  const { state } = useAppContext();
  
  return {
    currentBlock: state.currentBlock,
    chainId: state.chainId,
    isPolling: state.isPolling,
    publicClient: state.publicClient
  };
}

// Add a custom hook for wallet connection
export function useWalletConnection() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  // Import the provider from WalletConnect component
  useEffect(() => {
    // Dynamic import to avoid circular dependency
    import('../components/WalletConnect.js').then(({ provider }) => {
      const updateConnectionState = () => {
        setIsWalletConnected(provider.connected);
        setConnectedAddress(provider.accounts[0] || null);
      };
      
      // Initial state
      updateConnectionState();
      
      // Listen for connection changes
      provider.on('connect', updateConnectionState);
      provider.on('disconnect', updateConnectionState);
      provider.on('accountsChanged', updateConnectionState);
      
      return () => {
        provider.removeListener('connect', updateConnectionState);
        provider.removeListener('disconnect', updateConnectionState);
        provider.removeListener('accountsChanged', updateConnectionState);
      };
    });
  }, []);
  
  return {
    connectedAddress,
    isWalletConnected
  };
} 