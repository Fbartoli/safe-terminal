#!/usr/bin/env node
import { config } from 'dotenv';
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

// Load environment variables from .env file
config();

console.log(process.env['WALLETCONNECT_PROJECT_ID'])
export const provider = await EthereumProvider.init({
	projectId: process.env['WALLETCONNECT_PROJECT_ID']!,
	metadata: {
	  name: 'Safe Terminal',
	  description: 'Terminal interface for Safe contracts',
	  url: 'https://github.com/fbartoli/safe-terminal',
	  icons: ['https://avatars.githubusercontent.com/u/37784886']
	},
	showQrModal: false,
	optionalChains: [0],
});

// Enhanced terminal management
const setupTerminal = () => {
  // Enable alternative buffer
  process.stdout.write('\x1b[?1049h');
  
  // Save current terminal settings
  process.stdout.write('\x1b7');
  
  // Hide cursor
  process.stdout.write('\x1b[?25l');
  
  // Clear screen and move to top-left
  process.stdout.write('\x1b[2J\x1b[0;0H');
  
  // Disable line wrapping
  process.stdout.write('\x1b[?7l');
  
  // Disable mouse events
  process.stdout.write('\x1b[?1000l'); // Disable mouse click tracking
  process.stdout.write('\x1b[?1002l'); // Disable mouse motion tracking
  process.stdout.write('\x1b[?1003l'); // Disable all mouse tracking
  process.stdout.write('\x1b[?1015l'); // Disable urxvt mouse mode
  process.stdout.write('\x1b[?1006l'); // Disable SGR mouse mode
};

const restoreTerminal = () => {
  // Enable mouse events (restore default state)
  process.stdout.write('\x1b[?1000l');
  process.stdout.write('\x1b[?1002l');
  process.stdout.write('\x1b[?1003l');
  process.stdout.write('\x1b[?1015l');
  process.stdout.write('\x1b[?1006l');
  
  // Show cursor
  process.stdout.write('\x1b[?25h');
  
  // Enable line wrapping
  process.stdout.write('\x1b[?7h');
  
  // Restore cursor position
  process.stdout.write('\x1b8');
  
  // Restore original buffer
  process.stdout.write('\x1b[?1049l');
};

// Handle terminal resize
const handleResize = () => {
  // Clear screen and move to top-left
  process.stdout.write('\x1b[2J\x1b[0;0H');
};

// Setup terminal
setupTerminal();

// Handle window resize
process.stdout.on('resize', handleResize);

const cli = meow(
	`
	Usage
	  $ safe-terminal [options]

	Options
		--address     Ethereum address to use
		--rpc-url     RPC URL to connect to
		--no-colors   Disable colors
		--debug       Enable debug mode

	Examples
	  $ safe-terminal --address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
	  $ safe-terminal --address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
	  $ safe-terminal --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
`,
	{
		importMeta: import.meta,
		flags: {
			address: {
				type: 'string',
			},
			rpcUrl: {
				type: 'string',
			},
			colors: {
				type: 'boolean',
				default: true,
			},
			debug: {
				type: 'boolean',
				default: false,
			},
		},
	},
);

let isExiting = false;

// Handle process termination gracefully
const cleanup = () => {
  if (isExiting) return; // Prevent multiple cleanup attempts
  isExiting = true;

  // Restore terminal settings
  restoreTerminal();

  // Force exit immediately
  process.exit(0);
};

// Register cleanup handlers with higher priority
process.on('SIGINT', () => {
  console.log('Exiting...');
  cleanup();
});

process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Start the application
const {waitUntilExit} = render(<App initialAddress={cli.flags.address} initialRpcUrl={cli.flags.rpcUrl} />, {
	debug: cli.flags.debug,
  exitOnCtrlC: true, // Let Ink handle Ctrl+C
});

// Keep the process running until the app exits
try {
  await waitUntilExit();
} finally {
  cleanup();
}
