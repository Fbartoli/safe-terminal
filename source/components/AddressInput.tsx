import React, { useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { isAddress } from 'viem';

interface AddressInputProps {
  onSubmit: (address: string) => void;
}

export default function AddressInput({ onSubmit }: AddressInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const pasteTimeoutRef = useRef<NodeJS.Timeout>();
  const pasteBufferRef = useRef('');

  useInput((input, key) => {
    if (submitted) return;

    // Handle Enter key
    if (key.return) {
      if (isPasting) {
        // If we're still pasting, wait for the paste to complete
        return;
      }

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

    // Handle backspace/delete
    if (key.backspace || key.delete) {
      if (!isPasting) {
        setAddress(prev => prev.slice(0, -1));
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
        
        if (cleanedContent !== '') {
          setAddress(cleanedContent);
          
          // Clear any previous errors
          if (error) setError('');
          
          // Provide immediate feedback if it's not a valid address
          if (!isAddress(cleanedContent)) {
            setError('Note: Pasted content is not a valid Ethereum address format');
          }
        }
        
        pasteBufferRef.current = ''; // Clear the buffer
      }, 50); // Wait 50ms for more input

      return;
    }

    // Handle single character input (typing) - only allow hexadecimal characters
    if (input.length === 1 && /^[0-9a-fA-Fx]$/.test(input) && !isPasting) {
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