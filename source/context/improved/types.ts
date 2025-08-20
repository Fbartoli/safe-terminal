// Centralized type definitions for better maintainability
import { PublicClient } from 'viem';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

export type WalletConnectProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

// Domain-specific state interfaces
export interface NetworkState {
  rpcUrl?: string;
  chainId?: number;
  currentBlock?: number;
  isPolling: boolean;
  publicClient?: PublicClient;
}

export interface WalletState {
  provider?: WalletConnectProvider;
  isConnected: boolean;
  connectedAddress: string | null;
  isInitializing: boolean;
}

export interface UIState {
  activeTab: number;
  isSettingAddress: boolean;
  isSettingRpcUrl: boolean;
}

export interface SafeConfigState {
  ethereumAddress?: string;
  refreshKey: number;
}

// Combined app state
export interface AppState {
  network: NetworkState;
  wallet: WalletState;
  ui: UIState;
  safeConfig: SafeConfigState;
}

// Action types with better organization
export type NetworkAction =
  | { type: 'NETWORK_SET_RPC_URL'; payload: string }
  | { type: 'NETWORK_SET_CHAIN_ID'; payload: number }
  | { type: 'NETWORK_SET_CURRENT_BLOCK'; payload: number }
  | { type: 'NETWORK_SET_IS_POLLING'; payload: boolean }
  | { type: 'NETWORK_SET_PUBLIC_CLIENT'; payload: PublicClient | undefined };

export type WalletAction =
  | { type: 'WALLET_SET_PROVIDER'; payload: WalletConnectProvider | undefined }
  | { type: 'WALLET_SET_CONNECTED'; payload: boolean }
  | { type: 'WALLET_SET_ADDRESS'; payload: string | null }
  | { type: 'WALLET_SET_INITIALIZING'; payload: boolean };

export type UIAction =
  | { type: 'UI_SET_ACTIVE_TAB'; payload: number }
  | { type: 'UI_SET_SETTING_ADDRESS'; payload: boolean }
  | { type: 'UI_SET_SETTING_RPC_URL'; payload: boolean };

export type SafeConfigAction =
  | { type: 'SAFE_SET_ADDRESS'; payload: string }
  | { type: 'SAFE_INCREMENT_REFRESH_KEY' }
  | { type: 'SAFE_INITIALIZE'; payload: { address?: string; rpcUrl?: string } };

export type AppAction = NetworkAction | WalletAction | UIAction | SafeConfigAction;

// Error state interface
export interface ErrorState {
  network?: string;
  wallet?: string;
  safe?: string;
}

// Hook return types
export interface TabHookReturn {
  activeTab: number;
  setActiveTab: (tabIndex: number) => void;
  tabs: readonly string[];
}

export interface AddressHookReturn {
  address?: string;
  isSettingAddress: boolean;
  setAddress: (address: string) => void;
  startChangingAddress: () => void;
  cancelChangingAddress: () => void;
}

export interface RpcUrlHookReturn {
  rpcUrl?: string;
  chainId?: number;
  isSettingRpcUrl: boolean;
  setRpcUrl: (url: string, chainId: number) => void;
  startChangingRpcUrl: () => void;
  cancelChangingRpcUrl: () => void;
}

export interface BlockchainHookReturn {
  currentBlock?: number;
  chainId?: number;
  isPolling: boolean;
  publicClient?: PublicClient;
}

export interface WalletHookReturn {
  provider?: WalletConnectProvider;
  connectedAddress: string | null;
  isWalletConnected: boolean;
  isInitializing: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  initializeProvider: () => Promise<WalletConnectProvider | undefined>;
}
