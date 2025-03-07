import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { isAddress } from 'viem';

interface AddressInputProps {
  onSubmit: (address: string) => void;
}

export default function AddressInput({ onSubmit }: AddressInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useInput((input, key) => {
    if (submitted) return;

    // Handle paste operation (input will contain the entire pasted content)
    if (input.length > 1) {
      // Clean up the pasted content - remove whitespace
      const cleanedContent = input.trim();
      
      if (cleanedContent !== '') {
        // Set the address with the pasted content
        setAddress(cleanedContent);
        
        // Clear any previous errors
        if (error) setError('');
        
        // Provide immediate feedback if it's not a valid address
        if (!isAddress(cleanedContent)) {
          setError('Note: Pasted content is not a valid Ethereum address format');
        }
      }
      return;
    }

    if (key.return) {
      if (address.trim() === '') {
        setError('Address cannot be empty');
        return;
      }

      if (!isAddress(address)) {
        setError('Invalid Ethereum address format');
        return;
      }

      setError('');
      setSubmitted(true);
      onSubmit(address);
      return;
    }

    if (key.backspace || key.delete) {
      setAddress(prev => prev.slice(0, -1));
      if (error) setError('');
      return;
    }

    // Only allow hexadecimal characters for Ethereum addresses
    if (/^[0-9a-fA-Fx]$/.test(input)) {
      setAddress(prev => prev + input);
      if (error) setError('');
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Enter an Ethereum address:</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>{'> '}</Text>
        <Text color="green">{address}</Text>
        {!submitted && <Text>_</Text>}
      </Box>
      
      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      
      {submitted && (
        <Box>
          <Text color="green">✓ Address submitted successfully!</Text>
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text dimColor>Press Enter to submit</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>Press </Text>
        <Text dimColor color="cyan">Command+V</Text>
        <Text dimColor> (macOS) or </Text>
        <Text dimColor color="cyan">Ctrl+V</Text>
        <Text dimColor> (Windows) to paste an address</Text>
      </Box>
    </Box>
  );
} 