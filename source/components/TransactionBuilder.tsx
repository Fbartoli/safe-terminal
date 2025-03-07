import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { isAddress, type Abi, type Address, encodeFunctionData, type AbiFunction as ViemAbiFunction } from 'viem';
import { useBlockchain } from '../context/AppContext.js';
import { provider } from '../cli.js';

interface TransactionBuilderProps {
  onSubmit: (transaction: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  }) => void;
}

type Step = 'contract' | 'abi' | 'function' | 'parameters';

type WriteFunction = ViemAbiFunction & {
  type: 'function';
  stateMutability: 'payable' | 'nonpayable';
};

export default function TransactionBuilder({ onSubmit }: TransactionBuilderProps) {
  const { publicClient } = useBlockchain();
  const [step, setStep] = useState<Step>('contract');
  const [contractAddress, setContractAddress] = useState('');
  const [abiString, setAbiString] = useState('');
  const [parsedAbi, setParsedAbi] = useState<Abi>([]);
  const [selectedFunction, setSelectedFunction] = useState<number>(0);
  const [parameters, setParameters] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [writeFunctions, setWriteFunctions] = useState<WriteFunction[]>([]);
  const [isPasting, setIsPasting] = useState(false);
  const pasteTimeoutRef = useRef<NodeJS.Timeout>();
  const pasteBufferRef = useRef('');
  const [connected, setConnected] = useState(false);

  // Check if wallet is connected
  useEffect(() => {
    const checkConnection = () => {
      setConnected(provider.connected);
    };

    checkConnection();
    
    // Listen for connection changes
    const handleConnect = () => {
      setConnected(true);
    };
    
    const handleDisconnect = () => {
      setConnected(false);
    };
    
    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
    
    return () => {
      provider.removeListener('connect', handleConnect);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }, []);

  // Filter write functions from ABI
  useEffect(() => {
    if (parsedAbi.length > 0) {
      const functions = parsedAbi.filter((item): item is WriteFunction => 
        item.type === 'function' && 
        (item.stateMutability === 'payable' || item.stateMutability === 'nonpayable')
      );
      setWriteFunctions(functions);
    }
  }, [parsedAbi]);

  const prepareTransaction = async (
    address: Address,
    abi: Abi,
    functionName: string,
    args: unknown[]
  ) => {
    const data = encodeFunctionData({
      abi,
      functionName,
      args
    });

    return {
      to: address,
      data,
      value: 0n
    };
  };

  const handleAbiInput = (input: string) => {
    try {
      const cleanedAbi = input.trim();
      const parsedJson = JSON.parse(cleanedAbi);
      
      // If it's an array, use it directly, if it's an object, wrap it in an array
      const abiToUse = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
      
      setAbiString(cleanedAbi);
      setParsedAbi(abiToUse);
      setStep('function');
    } catch (err) {
      setError('Invalid ABI format. Please provide a valid JSON ABI');
    }
  };

  useInput((input, key) => {
    setError('');

    if (step === 'contract') {
      // Handle paste operation for contract address
      if (input.length > 1) {
        const cleanedAddress = input.trim();
        if (isAddress(cleanedAddress)) {
          setContractAddress(cleanedAddress);
          setStep('abi');
        } else {
          setError('Invalid contract address format');
        }
        return;
      }

      if (key.return) {
        if (!isAddress(contractAddress)) {
          setError('Invalid contract address');
          return;
        }
        setStep('abi');
        return;
      }

      if (key.backspace || key.delete) {
        setContractAddress(prev => prev.slice(0, -1));
        return;
      }

      if (/^[0-9a-fA-Fx]$/.test(input)) {
        setContractAddress(prev => prev + input);
      }
    }

    if (step === 'abi') {
      // Handle paste operation for ABI
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
          handleAbiInput(pasteBufferRef.current);
          pasteBufferRef.current = ''; // Clear the buffer
        }, 50); // Wait 50ms for more input

        return;
      }

      if (key.return) {
        if (isPasting) {
          // If we're still pasting, wait for the paste to complete
          return;
        }
        handleAbiInput(abiString);
        return;
      }

      if (key.backspace || key.delete) {
        if (!isPasting) {
          setAbiString(prev => prev.slice(0, -1));
        }
        return;
      }

      if (!isPasting) {
        setAbiString(prev => prev + input);
      }
    }

    if (step === 'function') {
      if (key.return) {
        if (writeFunctions.length === 0) {
          setError('No write functions found in ABI');
          return;
        }
        const currentFunction = writeFunctions[selectedFunction];
        if (!currentFunction) {
          setError('Selected function not found');
          return;
        }
        setParameters(new Array(currentFunction.inputs.length).fill(''));
        setStep('parameters');
        return;
      }

      if (key.upArrow) {
        setSelectedFunction(prev => (prev > 0 ? prev - 1 : writeFunctions.length - 1));
      }

      if (key.downArrow) {
        setSelectedFunction(prev => (prev < writeFunctions.length - 1 ? prev + 1 : 0));
      }
    }

    if (step === 'parameters') {
      const currentFunction = writeFunctions[selectedFunction];
      if (!currentFunction) {
        setError('Selected function not found');
        return;
      }

      const currentParams = [...parameters];

      if (key.return) {
        try {
          if (!publicClient) throw new Error('Public client not available');
          if (!connected) throw new Error('Wallet not connected. Please connect your wallet first.');

          const args = parameters.map((param, index) => {
            const input = currentFunction.inputs[index];
            if (!input) throw new Error(`Input not found for parameter ${index}`);

            // Basic type conversion - extend as needed
            if (input.type.includes('int')) {
              return BigInt(param);
            }
            if (input.type === 'bool') {
              return param.toLowerCase() === 'true';
            }
            return param;
          });

          void prepareTransaction(
            contractAddress as Address,
            parsedAbi,
            currentFunction.name,
            args
          ).then(onSubmit);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Invalid parameters');
        }
        return;
      }

      if (key.backspace || key.delete) {
        const paramIndex = parameters.findIndex(p => p !== '');
        if (paramIndex >= 0) {
          const currentValue = currentParams[paramIndex];
          if (currentValue) {
            currentParams[paramIndex] = currentValue.slice(0, -1);
            setParameters(currentParams);
          }
        }
        return;
      }

      const emptyParamIndex = parameters.findIndex(p => p === '');
      if (emptyParamIndex >= 0) {
        currentParams[emptyParamIndex] = input;
        setParameters(currentParams);
      }
    }
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pasteTimeoutRef.current) {
        clearTimeout(pasteTimeoutRef.current);
      }
    };
  }, []);

  const renderStep = () => {
    switch (step) {
      case 'contract':
        return (
          <Box flexDirection="column">
            <Text>Enter contract address:</Text>
            <Text color="green">{contractAddress}<Text color="gray">_</Text></Text>
            {error && <Text color="red">{error}</Text>}
            <Box marginTop={1}>
              <Text dimColor>Press </Text>
              <Text color="cyan">Enter</Text>
              <Text dimColor> to confirm or paste your address</Text>
            </Box>
          </Box>
        );

      case 'abi':
        return (
          <Box flexDirection="column">
            <Text>Paste contract ABI:</Text>
            <Text color="green">{abiString}<Text color="gray">_</Text></Text>
            {error && <Text color="red">{error}</Text>}
            <Box marginTop={1}>
              <Text dimColor>Press </Text>
              <Text color="cyan">Enter</Text>
              <Text dimColor> to confirm or paste your ABI</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Accepts:</Text>
              <Text dimColor> - Full ABI array</Text>
              <Text dimColor> - Single function ABI object</Text>
            </Box>
          </Box>
        );

      case 'function':
        const selectedFn = writeFunctions[selectedFunction];
        return (
          <Box flexDirection="column">
            <Text>Select function to call (use ↑↓ arrows):</Text>
            {writeFunctions.map((func, index) => (
              <Text key={func.name} color={index === selectedFunction ? 'green' : 'white'}>
                {index === selectedFunction ? '> ' : '  '}
                {func.name}
                {func.stateMutability === 'payable' && (
                  <Text color="yellow"> (payable)</Text>
                )}
              </Text>
            ))}
            {selectedFn && (
              <Box flexDirection="column" marginTop={1}>
                <Text dimColor>Function details:</Text>
                <Text>Name: <Text color="cyan">{selectedFn.name}</Text></Text>
                <Text>Inputs: <Text color="yellow">{selectedFn.inputs.length}</Text></Text>
                <Text>Type: <Text color="green">{selectedFn.stateMutability}</Text></Text>
              </Box>
            )}
            {error && <Text color="red">{error}</Text>}
          </Box>
        );

      case 'parameters':
        const currentFunction = writeFunctions[selectedFunction];
        if (!currentFunction) return null;

        return (
          <Box flexDirection="column">
            <Text>Enter parameters for {currentFunction.name}:</Text>
            {currentFunction.inputs.map((input, index) => (
              <Box key={index}>
                <Text>{input.name} ({input.type}): </Text>
                <Text color="green">{parameters[index]}</Text>
                {index === parameters.findIndex(p => p === '') && <Text color="gray">_</Text>}
              </Box>
            ))}
            {error && <Text color="red">{error}</Text>}
          </Box>
        );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} flexDirection="column">
        <Text bold>Transaction Builder</Text>
        {contractAddress && step !== 'contract' && (
          <Text dimColor>Contract: <Text color="cyan">{contractAddress}</Text></Text>
        )}
      </Box>
      
      {!connected ? (
        <Box flexDirection="column" padding={1} borderStyle="round" borderColor="yellow">
          <Text color="yellow">⚠️ Wallet not connected</Text>
          <Text>Go to the WalletConnect tab to connect your wallet first.</Text>
          <Text dimColor>Press <Text color="cyan">3</Text> to navigate to WalletConnect</Text>
        </Box>
      ) : (
        renderStep()
      )}
    </Box>
  );
} 