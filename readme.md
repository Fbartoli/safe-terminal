# Safe Terminal

A terminal-based interface for interacting with Safe (formerly Gnosis Safe) smart contracts, built with React Ink. This application provides a modern, interactive terminal UI for managing and interacting with Safe smart contracts directly from your command line.

## Features

- 🔐 Safe Contract Integration
  - View Safe details (owners, threshold, nonce)
  - Build and propose transactions
  - Monitor Safe status in real-time

- 🌐 Web3 Connectivity
  - WalletConnect integration for secure wallet connections
  - Real-time blockchain monitoring
  - Support for multiple networks
  - Custom RPC endpoint configuration

- 💻 Interactive Terminal UI
  - Multi-tab interface with keyboard navigation
  - Real-time updates and notifications
  - Beautiful terminal-based UI components
  - Cross-platform support

## Installation

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Link the CLI globally (optional)
pnpm link --global
```

## Environment Variables

The application requires certain environment variables to be set. You can set them up in two ways:

### Method 1: Using a .env file (Recommended for Development)

Create a `.env` file in the project root:

```bash
WALLETCONNECT_PROJECT_ID=your_project_id
```

### Method 2: Setting Environment Variables Directly

```bash
# For Unix-like systems (Linux, macOS)
export WALLETCONNECT_PROJECT_ID=your_project_id
safe-terminal

# For Windows (PowerShell)
$env:WALLETCONNECT_PROJECT_ID="your_project_id"
safe-terminal

# Or inline with the command
WALLETCONNECT_PROJECT_ID=your_project_id safe-terminal
```

Required variables:
- `WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID (Get it from [WalletConnect Cloud](https://cloud.walletconnect.com/))

## Usage

```bash
# Run directly
pnpm start

# Or if linked globally
safe-terminal

# Start with specific Safe address and RPC URL
safe-terminal --address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
```

### Command Line Options

```
Usage
  $ safe-terminal [options]

Options
  --address     Ethereum address of the Safe contract
  --rpc-url     RPC URL to connect to
  --no-colors   Disable colors
  --debug       Enable debug mode

Examples
  $ safe-terminal --address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
  $ safe-terminal --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
```

## Navigation

- Press `1` to access Dashboard
- Press `2` to access Transaction Builder
- Press `3` to access WalletConnect
- Press `4` to access Settings
- Press `r` to refresh Safe information

## Development

```bash
# Run in development mode with auto-reloading
pnpm dev

# Run with environment variables
WALLETCONNECT_PROJECT_ID=your_project_id pnpm dev
```

## License

MIT
