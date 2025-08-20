#!/usr/bin/env node
import { config } from 'dotenv';
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import { EventEmitter } from 'events';

// Load environment variables from .env file
config();

// Create custom event emitter for terminal events
const terminalEvents = new EventEmitter();

// Terminal capabilities detection
const terminalCapabilities = {
  trueColor: process.env['COLORTERM'] === 'truecolor',
  unicode: process.platform !== 'win32' || Boolean(process.env['WT_SESSION']),
  columns: process.stdout.columns || 80,
  rows: process.stdout.rows || 24,
  termProgram: process.env['TERM_PROGRAM'],
  isTmux: Boolean(process.env['TMUX']),
  isScreen: Boolean(process.env['STY'])
};

// Minimal terminal setup - let Ink handle most terminal configuration
const setupTerminal = () => {
  // Clear terminal screen and scrollback buffer for clean start
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
  
  // Disable mouse tracking to prevent interference with input
  process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
  process.stdout.write('\x1b[?1002l'); // Disable mouse motion events
  process.stdout.write('\x1b[?1003l'); // Disable all mouse events
  process.stdout.write('\x1b[?1006l'); // Disable SGR mouse mode
  
  // Set title if not in tmux/screen
  if (!terminalCapabilities.isTmux && !terminalCapabilities.isScreen) {
    process.stdout.write('\x1b]0;Safe Terminal\x07');
  }
};

const restoreTerminal = () => {
  // Minimal cleanup - let Ink handle most terminal restoration
  
  // Ensure mouse tracking is disabled
  process.stdout.write('\x1b[?1000l');
  process.stdout.write('\x1b[?1002l');
  process.stdout.write('\x1b[?1003l');
  process.stdout.write('\x1b[?1006l');
  
  // Clear screen
  console.clear();
};

// Remove custom input handling to let Ink process all input naturally
// Ink's built-in exitOnCtrlC: true will handle Ctrl+C gracefully

// Simple resize handler - let Ink handle the rendering
const handleResize = () => {
  // Update terminal capabilities for our own tracking
  terminalCapabilities.columns = process.stdout.columns || 80;
  terminalCapabilities.rows = process.stdout.rows || 24;
  
  // Emit custom resize event with dimensions
  terminalEvents.emit('resize', {
    columns: terminalCapabilities.columns,
    rows: terminalCapabilities.rows
  });
};

// Focus events removed - not needed without custom input handling

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
				default: terminalCapabilities.trueColor,
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

// Enhanced signal handling
const handleSignal = (signal: string) => {
  console.log(`\nReceived ${signal}...`);
  cleanup();
};

// Register cleanup handlers with higher priority
process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));
process.on('SIGHUP', () => handleSignal('SIGHUP'));
process.on('exit', cleanup);

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\nUncaught error:', error);
  cleanup();
});

process.on('unhandledRejection', (reason) => {
  console.error('\nUnhandled rejection:', reason);
  cleanup();
});

// Setup terminal just before starting Ink
setupTerminal();

// Start the application
const {waitUntilExit} = render(<App 
  initialAddress={cli.flags.address} 
  initialRpcUrl={cli.flags.rpcUrl}
/>, {
	debug: cli.flags.debug,
  exitOnCtrlC: true,
  patchConsole: false, // Don't patch console to avoid conflicts
});

// Keep the process running until the app exits
try {
  await waitUntilExit();
} finally {
  cleanup();
}
