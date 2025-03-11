#!/usr/bin/env node
import { config } from 'dotenv';
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
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
  
  // Enable focus events if supported
  process.stdout.write('\x1b[?1004h');
  
  // Set title if not in tmux/screen
  if (!terminalCapabilities.isTmux && !terminalCapabilities.isScreen) {
    process.stdout.write('\x1b]0;Safe Terminal\x07');
  }
  
  // Enable bracketed paste mode
  process.stdout.write('\x1b[?2004h');
  
  // Set cursor style to block
  process.stdout.write('\x1b[2 q');
  
  // Disable line wrapping
  process.stdout.write('\x1b[?7l');
  
  // Optimize terminal performance
  process.stdout.write('\x1b[?47l'); // Disable alternate screen buffer switching
  process.stdout.write('\x1b[?9l');  // Disable X10 mouse mode
  process.stdout.write('\x1b[?1000l'); // Disable mouse click tracking
  process.stdout.write('\x1b[?1002l'); // Disable mouse motion tracking
  process.stdout.write('\x1b[?1003l'); // Disable all mouse tracking
  process.stdout.write('\x1b[?1015l'); // Disable urxvt mouse mode
  process.stdout.write('\x1b[?1006l'); // Disable SGR mouse mode
  
  // Enable synchronized output if in tmux
  if (terminalCapabilities.isTmux) {
    process.stdout.write('\x1bPtmux;\\x1b[>Sm\x1b\\');
  }
};

const restoreTerminal = () => {
  // Disable focus events
  process.stdout.write('\x1b[?1004l');
  
  // Disable bracketed paste mode
  process.stdout.write('\x1b[?2004l');
  
  // Restore cursor style
  process.stdout.write('\x1b[0 q');
  
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
  
  // Clear tmux synchronized output if needed
  if (terminalCapabilities.isTmux) {
    process.stdout.write('\x1bPtmux;\\x1b[>rm\x1b\\');
  }
  
  // Restore cursor position
  process.stdout.write('\x1b8');
  
  // Clear screen before restoring buffer
  process.stdout.write('\x1b[2J');
  
  // Restore original buffer
  process.stdout.write('\x1b[?1049l');
  
  // Clear screen after buffer restore
  process.stdout.write('\x1b[2J');
};

// Enhanced resize handler
const handleResize = () => {
  // Update terminal capabilities
  terminalCapabilities.columns = process.stdout.columns || 80;
  terminalCapabilities.rows = process.stdout.rows || 24;
  
  // Clear screen and move to top-left
  process.stdout.write('\x1b[2J\x1b[0;0H');
  
  // Emit custom resize event with dimensions
  terminalEvents.emit('resize', {
    columns: terminalCapabilities.columns,
    rows: terminalCapabilities.rows
  });
};

// Handle focus events
const handleFocus = (focused: boolean) => {
  terminalEvents.emit('focus', focused);
};

// Setup focus event listener
process.stdin.on('data', (data: Buffer) => {
  // Check for focus events
  if (data[0] === 0x1b && data[1] === 0x5b && data[2] === 0x49) {
    handleFocus(true); // Focus gained
  } else if (data[0] === 0x1b && data[1] === 0x5b && data[2] === 0x4f) {
    handleFocus(false); // Focus lost
  }
});

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

// Start the application
const {waitUntilExit} = render(<App 
  initialAddress={cli.flags.address} 
  initialRpcUrl={cli.flags.rpcUrl}
/>, {
	debug: cli.flags.debug,
  exitOnCtrlC: true,
  patchConsole: true, // Capture console.log output
});

// Keep the process running until the app exits
try {
  await waitUntilExit();
} finally {
  cleanup();
}
