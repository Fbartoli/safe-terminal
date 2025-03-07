import React, { useMemo, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { type Address } from 'viem';
import AddressInput from './components/AddressInput.js';
import RpcUrlInput from './components/RpcUrlInput.js';
import Settings from './components/Settings.js';
import TabBar from './components/TabBar.js';
import SafeDetails from './components/SafeDetails.js';
import TransactionBuilder from './components/TransactionBuilder.js';
import WalletConnect from './components/WalletConnect.js';
import { AppProvider, useTab, useAddress, useRpcUrl, useBlockchain, useWalletConnection } from './context/AppContext.js';
import { SafeProvider, useSafe } from './context/SafeContext.js';

interface AppProps {
	initialAddress?: string;
	initialRpcUrl?: string;
}

// Debounce function
const debounce = (func: Function, wait: number) => {
	let timeout: NodeJS.Timeout;
	return function executedFunction(...args: any[]) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

// Optimized terminal clear function
const clearTerminal = () => {
	// Move cursor to top-left
	process.stdout.write('\u001B[0;0H');
	// Clear screen from cursor to end
	process.stdout.write('\u001B[J');
};

function AppContent() {
	const { stdout } = useStdout();
	const { activeTab, setActiveTab, tabs } = useTab();
	const { address, isSettingAddress, setAddress, startChangingAddress } = useAddress();
	const { rpcUrl, chainId, isSettingRpcUrl, setRpcUrl, startChangingRpcUrl } = useRpcUrl();
	const { currentBlock, isPolling } = useBlockchain();
	const { safeInfo, isLoading, error, refetch } = useSafe();
	const { connectedAddress, isWalletConnected } = useWalletConnection();
	// Add keyboard navigation
	useInput((input) => {
		if (!isSettingAddress && !isSettingRpcUrl) {
			if (input === '1') {
				setActiveTab(0); // Dashboard
			} else if (input === '2') {
				setActiveTab(1); // Transaction
			} else if (input === '3') {
				setActiveTab(2); // WalletConnect
			} else if (input === '4') {
				setActiveTab(3); // Settings
			} else if (input === 'r') {
				refetch();
			}
		}
	});

	// Memoized resize handler with debouncing
	const handleResize = useCallback(
		debounce(() => {
			clearTerminal();
		}, 100),
		[]
	);

	// Handle window resize
	useEffect(() => {
		stdout.on('resize', handleResize);

		return () => {
			stdout.off('resize', handleResize);
		};
	}, [stdout, handleResize]);

	// Memoize the settings component
	const memoizedSettings = useMemo(
		() => (
			<Settings
				ethereumAddress={address}
				rpcURL={rpcUrl}
				chainId={chainId}
				onChangeAddress={startChangingAddress}
				onChangeRpcUrl={startChangingRpcUrl}
			/>
		),
		[address, rpcUrl, chainId, startChangingAddress, startChangingRpcUrl]
	);

	const handleTransactionSubmit = (transaction: { to: Address; data: `0x${string}`; value: bigint }) => {
		console.log('Transaction prepared:', transaction);
		// Here you would typically send this to your Safe transaction handling logic
	};

	// Memoize the dashboard content
	const memoizedDashboard = useMemo(
		() => (
			<Box flexDirection="column" width="100%" gap={1} alignItems="center">
				{address && rpcUrl ? (
					<>
						<SafeDetails />
						<Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan" width="50%" alignItems="center">
							<Text bold>Quick Navigation</Text>
							<Text>Press <Text color="cyan">2</Text> to access Transaction Builder</Text>
							<Text>Press <Text color="cyan">3</Text> to connect your wallet</Text>
							<Text>Press <Text color="cyan">4</Text> to change settings</Text>
							<Text>Press <Text color="cyan">r</Text> to refresh Safe information</Text>
						</Box>
					</>
				) : (
					<Box padding={1} borderStyle="round" borderColor="yellow">
						<Text color="yellow">⚠️ Setup Required</Text>
						<Text>Please set your Safe address and RPC URL in Settings</Text>
						<Text dimColor>Press <Text color="cyan">4</Text> to navigate to Settings</Text>
					</Box>
				)}
			</Box>
		),
		[address, rpcUrl, safeInfo, isLoading, error]
	);

	// Memoize the transaction builder component
	const memoizedTransactionBuilder = useMemo(
		() => (
			<Box flexDirection="column" gap={1}>
				{address && rpcUrl && safeInfo && !isLoading && !error ? (
					<Box borderStyle="round" borderColor="green">
						<TransactionBuilder onSubmit={handleTransactionSubmit} />
					</Box>
				) : (
					<Box padding={1}>
						<Text color="yellow">
							{!address || !rpcUrl
								? "Please set your Safe address and RPC URL in Settings"
								: isLoading
									? "Loading Safe information..."
									: error
										? `Error loading Safe: ${error}`
										: "Safe information not available"}
						</Text>
					</Box>
				)}
			</Box>
		),
		[address, rpcUrl, safeInfo, isLoading, error]
	);

	// Memoize the WalletConnect component
	const memoizedWalletConnect = useMemo(
		() => <WalletConnect />,
		[]
	);

	const renderContent = () => {
		if (isSettingAddress) {
			return <AddressInput onSubmit={setAddress} />;
		}

		if (isSettingRpcUrl) {
			return <RpcUrlInput onSubmit={setRpcUrl} />;
		}

		if (activeTab === 1) {
			return memoizedTransactionBuilder;
		}

		if (activeTab === 2) {
			return memoizedWalletConnect;
		}

		if (activeTab === 3) {
			return memoizedSettings;
		}

		// Dashboard tab
		return memoizedDashboard;
	};

	// Memoize the header content
	const memoizedHeader = useMemo(
		() => (
			rpcUrl && chainId ? (
				<Box borderStyle="single" borderColor="green" padding={0} marginBottom={1}>
					<Box width="100%" flexDirection="column">
						<Box justifyContent="center">
							<Box marginRight={2}>
								<Text>Chain ID: </Text>
								<Text color="yellow">{chainId}</Text>
							</Box>

							<Box>
								<Text>Current Block: </Text>
								{currentBlock ? (
									<Text color="cyan">{currentBlock}</Text>
								) : (
									<Text color="gray">Loading...</Text>
								)}
							</Box>

							{isPolling && (
								<Box marginLeft={4}>
									<Text color="green">●</Text>
									<Text> Real-time updates</Text>
								</Box>
							)}
						</Box>

						<Box>

							{isWalletConnected && connectedAddress && (
								<Box>
									<Text>Wallet: </Text>
									<Text color="green">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</Text>
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			) : null
		),
		[rpcUrl, chainId, currentBlock, isPolling, connectedAddress, isWalletConnected, activeTab, tabs]
	);

	return (
		<Box flexDirection="column" height="100%">
			{memoizedHeader}

			<TabBar activeTab={activeTab} tabs={tabs} />

			{renderContent()}
		</Box>
	);
}

export default function App({ initialAddress, initialRpcUrl }: AppProps) {
	return (
		<AppProvider initialAddress={initialAddress} initialRpcUrl={initialRpcUrl}>
			<SafeProvider>
				<AppContent />
			</SafeProvider>
		</AppProvider>
	);
}
