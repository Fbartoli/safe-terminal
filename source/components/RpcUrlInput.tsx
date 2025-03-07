import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { createPublicClient, http } from 'viem';

interface RpcUrlInputProps {
  onSubmit: (url: string, chainId: number) => void;
  defaultUrl?: string;
}

export default function RpcUrlInput({ onSubmit, defaultUrl = '' }: RpcUrlInputProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  useInput(async (input, key) => {
    if (submitted || loading) return;

    if (input.length > 1) {
      setUrl(input);
      if (error) setError('');
    }

    if (key.return) {
      if (url.trim() === '') {
        setError('RPC URL cannot be empty');
        return;
      }

      // Basic URL validation
      try {
        new URL(url);
        setError('');
        setLoading(true);
        
        try {
          const client = createPublicClient({
            transport: http(url),
          });
          
          // Set a timeout for the RPC connection test
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
          });
          
          // Race between the actual request and the timeout
          const chainId = await Promise.race([
            client.getChainId(),
            timeoutPromise
          ]) as number;
          
          setChainId(chainId);
          setLoading(false);
          setSubmitted(true);
          onSubmit(url, chainId);
        } catch (e) {
          setLoading(false);
          setError(`Failed to connect to RPC: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } catch (e) {
        setError('Invalid URL format');
      }
      return;
    }

    if (key.backspace || key.delete) {
      setUrl(prev => prev.slice(0, -1));
      if (error) setError('');
      return;
    }

    // Allow most characters for URL input
    if (!key.ctrl && !key.meta && input.length === 1) {
      setUrl(prev => prev + input);
      if (error) setError('');
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Enter an Ethereum RPC URL:</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>{'> '}</Text>
        <Text color="green">{url}</Text>
        {!submitted && !loading && <Text>_</Text>}
      </Box>
      
      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      
      {loading && (
        <Box marginBottom={1}>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> Testing RPC connection...</Text>
        </Box>
      )}
      
      {submitted && (
        <Box flexDirection="column">
          <Box>
            <Text color="green">✓ RPC URL submitted successfully!</Text>
          </Box>
          {chainId && (
            <Box marginTop={1}>
              <Text>Chain ID: </Text>
              <Text color="yellow">{chainId}</Text>
            </Box>
          )}
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text dimColor>Press Enter to submit</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>Example: https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY</Text>
      </Box>
    </Box>
  );
} 