# Safe Terminal

A long-running terminal dashboard application built with React Ink.

## Features

- Real-time system monitoring
- Interactive terminal UI
- Multiple views with tab navigation
- Keyboard shortcuts for navigation
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

## Usage

```bash
# Run directly
pnpm start

# Or if linked globally
safe-terminal
```

### Command Line Options

```
Usage
  $ safe-terminal

Options
  --name        Your name
  --no-colors   Disable colors
  --debug       Enable debug mode

Examples
  $ safe-terminal --name=Jane
  Welcome to Safe Terminal, Jane!
```

## Navigation

- Press `q` to quit the application
- Press `1` or left arrow to switch to Dashboard tab
- Press `2` or right arrow to switch to System Info tab

## Development

```bash
# Run in development mode with auto-reloading
pnpm dev
```

## License

MIT
