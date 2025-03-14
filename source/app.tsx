import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
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

function AppContent() {
	const { activeTab, setActiveTab, tabs } = useTab();
	const { address, isSettingAddress, setAddress, startChangingAddress } = useAddress();
	const { rpcUrl, chainId, isSettingRpcUrl, setRpcUrl, startChangingRpcUrl } = useRpcUrl();
	const { currentBlock, isPolling } = useBlockchain();
	const { refetch } = useSafe();
	const { connectedAddress, provider } = useWalletConnection();

	const isConnected = provider?.connected || false;

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

	const handleTransactionSubmit = (transaction: { to: Address; data: `0x${string}`; value: bigint }) => {
		console.log('Transaction prepared:', transaction);
		// Here you would typically send this to your Safe transaction handling logic
	};

	// Memoize the content to prevent unnecessary re-renders
	const content = useMemo(() => {
		if (isSettingAddress) {
			return <AddressInput onSubmit={setAddress} />;
		}

		if (isSettingRpcUrl) {
			return <RpcUrlInput onSubmit={setRpcUrl} />;
		}

		return (
			<Box flexDirection="column" height="100%">
				{/* Header */}
				{rpcUrl && chainId && (
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
								{isConnected && connectedAddress && (
									<Box>
										<Text>Wallet: </Text>
										<Text color="green">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</Text>
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				)}

				{/* Tab Bar */}
				<TabBar activeTab={activeTab} tabs={tabs} />

				{/* Main Content */}
				<Box flexDirection="column" flexGrow={1} overflow="hidden">
					{activeTab === 0 && <SafeDetails />}
					{activeTab === 1 && <TransactionBuilder onSubmit={handleTransactionSubmit} />}
					{activeTab === 2 && <WalletConnect />}
					{activeTab === 3 && <Settings ethereumAddress={address} rpcURL={rpcUrl} chainId={chainId} onChangeAddress={startChangingAddress} onChangeRpcUrl={startChangingRpcUrl} />}
				</Box>
			</Box>
		);
	}, [activeTab, address, chainId, connectedAddress, currentBlock, isPolling, isSettingAddress, isSettingRpcUrl, provider, rpcUrl, tabs, handleTransactionSubmit]);

	return content;
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
