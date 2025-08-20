import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useSafeDetails } from '../hooks/useSafeData.js';
import { useAddress } from '../context/AppContext.js';

export default function SafeDetails() {
  const { data: safeInfo, isLoading, error } = useSafeDetails();
  const { address } = useAddress();

  if (isLoading) {
    return (
      <Box>
        <Text>Loading Safe details... </Text>
        <Text color="green"><Spinner /></Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Box marginTop={1}>
          <Text>Press </Text>
          <Text color="cyan" underline>r</Text>
          <Text> to retry</Text>
        </Box>
      </Box>
    );
  }

  if (!safeInfo) {
    return (
      <Box flexDirection="column">
        <Text>No Safe information available</Text>
        <Box marginTop={1}>
          <Text>Press </Text>
          <Text color="cyan" underline>r</Text>
          <Text> to retry</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
      <Box justifyContent="space-between">
        <Text bold>Safe Details</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text>Address: </Text>
        <Text color="cyan">{address}</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text>Owners ({safeInfo.owners.length}):</Text>
        {safeInfo.owners.map((owner, index) => (
          <Text key={owner} color="cyan">
            {index + 1}. {owner}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text>Required confirmations: </Text>
        <Text color="yellow">{safeInfo.threshold}</Text>
      </Box>

      <Box marginTop={1}>
        <Text>Version: </Text>
        <Text color="green">{safeInfo.version}</Text>
      </Box>

      <Box marginTop={1}>
        <Text>Nonce: </Text>
        <Text color="green">{safeInfo.nonce}</Text>
      </Box>
    </Box>
  );
} 