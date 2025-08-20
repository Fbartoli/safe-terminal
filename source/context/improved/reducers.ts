// Separate reducers for better maintainability
import { isAddress } from 'viem';
import {
  AppState,
  AppAction,
  NetworkState,
  WalletState,
  UIState,
  SafeConfigState,
  NetworkAction,
  WalletAction,
  UIAction,
  SafeConfigAction
} from './types.js';

// Individual domain reducers
export function networkReducer(state: NetworkState, action: NetworkAction): NetworkState {
  switch (action.type) {
    case 'NETWORK_SET_RPC_URL':
      return { ...state, rpcUrl: action.payload };
    case 'NETWORK_SET_CHAIN_ID':
      return { ...state, chainId: action.payload };
    case 'NETWORK_SET_CURRENT_BLOCK':
      return { ...state, currentBlock: action.payload };
    case 'NETWORK_SET_IS_POLLING':
      return { ...state, isPolling: action.payload };
    case 'NETWORK_SET_PUBLIC_CLIENT':
      return { ...state, publicClient: action.payload };
    default:
      return state;
  }
}

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'WALLET_SET_PROVIDER':
      return { ...state, provider: action.payload };
    case 'WALLET_SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'WALLET_SET_ADDRESS':
      return { ...state, connectedAddress: action.payload };
    case 'WALLET_SET_INITIALIZING':
      return { ...state, isInitializing: action.payload };
    default:
      return state;
  }
}

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'UI_SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'UI_SET_SETTING_ADDRESS':
      return { ...state, isSettingAddress: action.payload };
    case 'UI_SET_SETTING_RPC_URL':
      return { ...state, isSettingRpcUrl: action.payload };
    default:
      return state;
  }
}

export function safeConfigReducer(state: SafeConfigState, action: SafeConfigAction): SafeConfigState {
  switch (action.type) {
    case 'SAFE_SET_ADDRESS':
      return { ...state, ethereumAddress: action.payload };
    case 'SAFE_INCREMENT_REFRESH_KEY':
      return { ...state, refreshKey: state.refreshKey + 1 };
    case 'SAFE_INITIALIZE':
      const updates: Partial<SafeConfigState> = {};
      if (action.payload.address && isAddress(action.payload.address)) {
        updates.ethereumAddress = action.payload.address;
      }
      return { ...state, ...updates };
    default:
      return state;
  }
}

// Combined app reducer using individual reducers
export function appReducer(state: AppState, action: AppAction): AppState {
  // Route actions to appropriate domain reducers
  if (action.type.startsWith('NETWORK_')) {
    return {
      ...state,
      network: networkReducer(state.network, action as NetworkAction)
    };
  }

  if (action.type.startsWith('WALLET_')) {
    return {
      ...state,
      wallet: walletReducer(state.wallet, action as WalletAction)
    };
  }

  if (action.type.startsWith('UI_')) {
    return {
      ...state,
      ui: uiReducer(state.ui, action as UIAction)
    };
  }

  if (action.type.startsWith('SAFE_')) {
    return {
      ...state,
      safeConfig: safeConfigReducer(state.safeConfig, action as SafeConfigAction)
    };
  }

  // Handle compound actions that affect multiple domains
  if (action.type === 'SAFE_INITIALIZE') {
    const safeAction = action as SafeConfigAction & { type: 'SAFE_INITIALIZE' };
    let newState = { ...state };
    
    // Update safe config
    newState.safeConfig = safeConfigReducer(state.safeConfig, safeAction);
    
    // Also update network if RPC URL is provided
    if (safeAction.payload.rpcUrl) {
      try {
        new URL(safeAction.payload.rpcUrl);
        newState.network = networkReducer(state.network, {
          type: 'NETWORK_SET_RPC_URL',
          payload: safeAction.payload.rpcUrl
        });
      } catch (error) {
        console.error('Invalid RPC URL provided:', error);
      }
    }
    
    return newState;
  }

  return state;
}

// Initial state with better organization
export const initialAppState: AppState = {
  network: {
    rpcUrl: undefined,
    chainId: undefined,
    currentBlock: undefined,
    isPolling: false,
    publicClient: undefined
  },
  wallet: {
    provider: undefined,
    isConnected: false,
    connectedAddress: null,
    isInitializing: false
  },
  ui: {
    activeTab: 0,
    isSettingAddress: false,
    isSettingRpcUrl: false
  },
  safeConfig: {
    ethereumAddress: undefined,
    refreshKey: 0
  }
};
