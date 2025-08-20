import React, { useState, useRef } from 'react';
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
  const [isPasting, setIsPasting] = useState(false);
  const pasteTimeoutRef = useRef<NodeJS.Timeout>();
  const pasteBufferRef = useRef('');

  const handleUrlSubmit = async (urlToSubmit: string) => {
    if (urlToSubmit.trim() === '') {
      setError('RPC URL cannot be empty');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlToSubmit);
      setError('');
      setLoading(true);
      
      try {
        const client = createPublicClient({
          transport: http(urlToSubmit),
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
        onSubmit(urlToSubmit, chainId);
      } catch (e) {
        setLoading(false);
        setError(`Failed to connect to RPC: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } catch (e) {
      setError('Invalid URL format');
    }
  };

  useInput((input, key) => {
    if (submitted || loading) return;

    // Handle Enter key
    if (key.return) {
      if (isPasting) {
        // If we're still pasting, wait for the paste to complete
        return;
      }
      handleUrlSubmit(url);
      return;
    }

    // Handle backspace/delete
    if (key.backspace || key.delete) {
      if (!isPasting) {
        setUrl(prev => prev.slice(0, -1));
        if (error) setError('');
      }
      return;
    }

    // Handle paste operation - accumulate multi-character input
    if (input.length > 1) {
      // Start or continue paste operation
      setIsPasting(true);
      pasteBufferRef.current += input;

      // Clear any existing timeout
      if (pasteTimeoutRef.current) {
        clearTimeout(pasteTimeoutRef.current);
      }

      // Set a new timeout to process the paste buffer
      pasteTimeoutRef.current = setTimeout(() => {
        setIsPasting(false);
        const cleanedContent = pasteBufferRef.current.trim();
        setUrl(cleanedContent);
        pasteBufferRef.current = ''; // Clear the buffer
        if (error) setError('');
      }, 50); // Wait 50ms for more input

      return;
    }

    // Handle single character input (typing)
    if (input.length === 1 && !key.ctrl && !key.meta && !isPasting) {
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