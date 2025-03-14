import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useWalletConnection } from '../context/AppContext.js';
import qrcode from 'qrcode-terminal';
import clipboard from 'clipboardy';

export default function WalletConnect() {
  const { provider, connect, disconnect, isWalletConnected: connected, initializeProvider } = useWalletConnection();
  const [qrCode, setQrCode] = useState<string>('');
  const [accounts, setAccounts] = useState<string[]>([]);
  const [localChainId, setLocalChainId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [uri, setUri] = useState<string>('');
  const [terminalWidth, setTerminalWidth] = useState<number>(process.stdout.columns || 80);
  const [copied, setCopied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      setTerminalWidth(process.stdout.columns || 80);
    };

    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.removeListener('resize', handleResize);
    };
  }, []);

  // Set up event listeners for WalletConnect
  useEffect(() => {
    if (!provider) return;
    
    // Check initial connection state
    if (connected && provider.accounts.length > 0) {
      setAccounts(provider.accounts);
      setLocalChainId(provider.chainId);
    }

    // Display QR code when URI is available
    const handleDisplayUri = (uri: string) => {
      setUri(uri);
      qrcode.generate(uri, { small: true }, (qrcode: string) => {
        setQrCode(qrcode);
      });
    };

    // Handle successful connection
    const handleConnect = (_event: any) => {
      setAccounts(provider.accounts);
      setLocalChainId(provider.chainId);
      setError('');
    };

    // Handle disconnection
    const handleDisconnect = (_event: any) => {
      setAccounts([]);
      setLocalChainId(null);
    };

    // Handle account changes
    const handleAccountsChanged = (newAccounts: string[]) => {
      setAccounts(newAccounts);
    };

    // Handle chain changes
    const handleChainChanged = (newChainId: string) => {
      setLocalChainId(parseInt(newChainId, 10));
    };

    provider.on('display_uri', handleDisplayUri);
    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    // Clean up event listeners on unmount
    return () => {
      provider.removeListener('display_uri', handleDisplayUri);
      provider.removeListener('connect', handleConnect);
      provider.removeListener('disconnect', handleDisconnect);
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, connected]);

  // Handle keyboard input
  useInput((input) => {
    if (input === 'c' && !connected) {
      // Attempt to connect to wallet
      setIsInitializing(true);
      try {
        // First ensure provider is initialized with current chain ID
        initializeProvider()
          .then(() => connect())
          .then(() => {
            setIsInitializing(false);
          })
          .catch((err: any) => {
            setError(`Connection error: ${err.message}`);
            setIsInitializing(false);
          });
      } catch (err) {
        setError(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
        setIsInitializing(false);
      }
    }

    if (input === 'd' && connected) {
      // Disconnect wallet
      try {
        disconnect()
          .catch((err: any) => {
            setError(`Disconnection error: ${err.message}`);
          });
      } catch (err) {
        setError(`Disconnection error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Copy URI to clipboard
    if (input === 'y' && uri && !connected) {
      try {
        clipboard.writeSync(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      } catch (err) {
        setError(`Copy error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Wallet Connect</Text>
      </Box>

      {!connected ? (
        <Box flexDirection="column" gap={1}>
          <Text>Scan the QR code with your wallet app to connect</Text>
          <Text>Press <Text color="cyan">c</Text> to initiate connection</Text>
          {isInitializing && <Text color="yellow">Initializing WalletConnect...</Text>}
          {qrCode && <Text>{qrCode}</Text>}
          {uri && (
            <Box flexDirection="column">
              <Text>URI (press <Text color="yellow">y</Text> to copy):</Text>
              <Box
                width={terminalWidth}
                height={1}
                overflowX="hidden"
                flexShrink={0}
              >
                <Text>
                  {terminalWidth >= uri.length
                    ? uri
                    : uri.substring(0, terminalWidth - 3) + '...'}
                </Text>
              </Box>
              {copied && <Text color="green">✓ Copied to clipboard!</Text>}
            </Box>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text color="green">✓ Connected to wallet</Text>
          <Text>Chain ID: <Text color="yellow">{localChainId}</Text></Text>
          <Text>Accounts:</Text>
          {accounts.map((account, index) => (
            <Text key={index} color="cyan">{account}</Text>
          ))}
          <Box>
            <Text>Press <Text color="cyan">d</Text> to disconnect</Text>
          </Box>
        </Box>
      )}

      {error && <Text color="red">{error}</Text>}
    </Box>
  );
} 