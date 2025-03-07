import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { provider } from '../cli.js';
import qrcode from 'qrcode-terminal';

// Debug logging
// Initialize the WalletConnect provider


  

export default function WalletConnect() {
  const [qrCode, setQrCode] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState('');

  

  // Set up event listeners for WalletConnect
  useEffect(() => {
    // Check initial connection state
    setConnected(provider.connected);
    if (provider.connected && provider.accounts.length > 0) {
      setAccounts(provider.accounts);
      setChainId(provider.chainId);
    }

    // Display QR code when URI is available
    provider.on('display_uri', (uri: string) => {
      qrcode.generate(uri, {small: true}, (qrcode: string) => {
        setQrCode(qrcode);
      });
    });

    // Handle successful connection
    provider.on('connect', (_event: any) => {
      setConnected(true);
      setAccounts(provider.accounts);
      setChainId(provider.chainId);
      setError('');
    });

    // Handle disconnection
    provider.on('disconnect', (_event: any) => {
      setConnected(false);
      setAccounts([]);
      setChainId(null);
    });

    // Handle account changes
    provider.on('accountsChanged', (newAccounts: string[]) => {
      setAccounts(newAccounts);
    });

    // Handle chain changes
    provider.on('chainChanged', (newChainId: string) => {
      setChainId(parseInt(newChainId, 10));
    });

    // Clean up event listeners on unmount
    return () => {
      provider.removeListener('display_uri', () => {});
      provider.removeListener('connect', () => {});
      provider.removeListener('disconnect', () => {});
      provider.removeListener('accountsChanged', () => {});
      provider.removeListener('chainChanged', () => {});
    };
  }, []);

  // Handle keyboard input
  useInput((input) => {
    if (input === 'c' && !connected) {
      // Attempt to connect to wallet
      try {
        provider.connect()
          .then((_result: any) => {
            setAccounts(provider.accounts);
            setChainId(provider.chainId);
          })
          .catch((err: any) => {
            setError(`Connection error: ${err.message}`);
          });
      } catch (err) {
        setError(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (input === 'd' && connected) {
      // Disconnect wallet
      try {
        provider.disconnect()
          .catch((err: any) => {
            setError(`Disconnection error: ${err.message}`);
          });
      } catch (err) {
        setError(`Disconnection error: ${err instanceof Error ? err.message : String(err)}`);
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
          {qrCode && <Text>{qrCode}</Text>}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text color="green">✓ Connected to wallet</Text>
          <Text>Chain ID: <Text color="yellow">{chainId}</Text></Text>
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