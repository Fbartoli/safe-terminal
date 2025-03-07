import React from 'react';
import {Box, Text} from 'ink';

interface TabBarProps {
  activeTab: number;
  tabs: string[];
}

export default function TabBar({activeTab, tabs}: TabBarProps) {
  return (
    <Box width="100%" justifyContent="center">
      {tabs.map((tab, index) => (
        <Box key={index} marginRight={2}>
          <Text color={activeTab === index ? "green" : "gray"}>
            [{index + 1}] {tab}
          </Text>
        </Box>
      ))}
    </Box>
  );
} 