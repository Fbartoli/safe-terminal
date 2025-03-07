import React from 'react';
import { Box, Text, useInput } from 'ink';

interface SettingsProps {
  ethereumAddress?: string;
  rpcURL?: string;
  chainId?: number;
  onChangeAddress: () => void;
  onChangeRpcUrl: () => void;
}

export default function Settings({ 
  ethereumAddress, 
  rpcURL, 
  chainId,
  onChangeAddress,
  onChangeRpcUrl
}: SettingsProps) {
  
  useInput((input) => {
    if (input.toLowerCase() === 'a') {
      onChangeAddress();
    } else if (input.toLowerCase() === 'r') {
      onChangeRpcUrl();
      // Trigger a refetch when RPC URL is changed
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Settings</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text>Ethereum Address:</Text>
        <Box marginTop={1}>
          {ethereumAddress ? (
            <>
              <Text color="cyan">{ethereumAddress}</Text>
              <Box marginLeft={2}>
                <Text dimColor>[Press </Text>
                <Text color="cyan">a</Text>
                <Text dimColor> to change]</Text>
              </Box>
            </>
          ) : (
            <Text color="yellow">Not set press <Text color="cyan">'a'</Text> to change</Text>
          )}
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text>RPC URL:</Text>
        <Box marginTop={1}>
          {rpcURL ? (
            <>
              <Text color="cyan">{rpcURL}</Text>
              {chainId && (
                <Text color="yellow"> (Chain ID: {chainId})</Text>
              )}
              <Box marginLeft={2}>
                <Text dimColor>[Press </Text>
                <Text color="cyan">r</Text>
                <Text dimColor> to change]</Text>
              </Box>
            </>
          ) : (
            <Text color="yellow">Not set press <Text color="cyan">'r'</Text> to change</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
} 