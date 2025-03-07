import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const frames = [
  [
    "⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣀⣀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⣾⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⢀⠀⠈⡇⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⣿⠀⠁⠀⠘⠁⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⠈⠀⠀⡇⠀⠀⠀⠀",
    "⣀⣀⣀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠄⠀⠀⠸⢰⡏⠉⠳⣄⠰⠀⠀⢰⣷⠶⠛⣧⠀",
    "⢻⡀⠈⠙⠲⡄⣿⠀⠀⠀⠀⠀⠀⠀⠠⠀⢸⠀⠀⠀⠈⠓⠒⠒⠛⠁⠀⠀⣿⠀",
    "⠀⠻⣄⠀⠀⠙⣿⠀⠀⠀⠈⠁⠀⢠⠄⣰⠟⠀⢀⡔⢠⠀⠀⠀⠀⣠⠠⡄⠘⢧",
    "⠀⠀⠈⠛⢦⣀⣿⠀⠀⢠⡆⠀⠀⠈⠀⣯⠀⠀⠈⠛⠛⠀⠠⢦⠄⠙⠛⠃⠀⢸",
    "⠀⠀⠀⠀⠀⠉⣿⠀⠀⠀⢠⠀⠀⢠⠀⠹⣆⠀⠀⠀⠢⢤⠠⠞⠤⡠⠄⠀⢀⡾",
    "⠀⠀⠀⠀⠀⢀⡿⠦⢤⣤⣤⣤⣤⣤⣤⣤⡼⣷⠶⠤⢤⣤⣤⡤⢤⡤⠶⠖⠋⠀",
    "⠀⠀⠀⠀⠀⠸⣤⡴⠋⠸⣇⣠⠼⠁⠀⠀⠀⠹⣄⣠⠞⠀⢾⡀⣠⠃⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠁⠀⠀⠀⠀⠀"
  ]
] as const;

const rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan'] as const;

export default function NyanCat() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [rainbowOffset, setRainbowOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
      setRainbowOffset(prev => (prev + 1) % rainbowColors.length);
    }, 150);

    return () => clearInterval(timer as NodeJS.Timeout);
  }, []);

  const renderRainbow = () => {
    return (
      <Box>
        {Array.from({ length: 8 }).map((_, i) => (
          <Text
            key={i}
            color={rainbowColors[(i + rainbowOffset) % rainbowColors.length]}
          >
            ═══
          </Text>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" alignItems="flex-end">
      <Box marginRight={2}>
        {renderRainbow()}
      </Box>
      <Box flexDirection="column">
        {frames[frameIndex]?.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
} 