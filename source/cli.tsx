#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

// Function to clear the terminal
const clearTerminal = () => {
	// Clear the terminal using ANSI escape codes
	// This works on most terminals
	process.stdout.write('\x1Bc');
	
	// Alternative methods for different environments
	// process.stdout.write('\u001b[2J\u001b[0;0H'); // Another common method
	// console.clear(); // Node.js method, but doesn't work in all environments
};

// Clear the terminal before starting
clearTerminal();

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

// Handle process termination gracefully
process.on('SIGINT', () => {
	process.exit(0);
});

// Start the application
const {waitUntilExit} = render(<App initialAddress={cli.flags.address} initialRpcUrl={cli.flags.rpcUrl} />, {
	debug: cli.flags.debug,
});

// Keep the process running until the app exits
await waitUntilExit();
