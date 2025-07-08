# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension for monitoring network ports with intelligent configuration processing and real-time status updates. The extension uses zero external dependencies for security, relying only on native Node.js modules.

## Essential Commands

```bash
# Development
npm run compile        # Compile TypeScript to JavaScript
npm run watch         # Watch mode - recompiles on file changes

# Testing
npm test              # Run all Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run start-test-servers # Start servers for testing

# Publishing
npm run package      # Create .vsix package
npm run publish      # Publish to VS Code marketplace
```

## Architecture Overview

### Core Modules

1. **extension.ts**: Entry point managing VS Code extension lifecycle
   - Activates on startup
   - Manages monitor instances per workspace
   - Handles configuration changes and commands

2. **config.ts**: 5-step intelligent configuration processing pipeline
   - Well-known port replacement (e.g., "http" → 80)
   - Port range expansion ("3000-3009" → [3000, 3001, ...])
   - Smart grouping with __NOTITLE
   - Array to object conversion
   - Structure normalization

3. **monitor.ts**: Core monitoring engine
   - Uses native Node.js net module for TCP connections
   - Event-driven architecture with status updates
   - Handles connection attempts and process management
   - Intelligent process detection with server/client prioritization

4. **labelResolver.ts** & **patternMatcher.ts**: Pattern-based port labeling
   - Supports glob patterns for flexible matching
   - Resolves labels based on workspace patterns

### Configuration Flow

The extension supports multiple configuration formats that are automatically transformed:

```typescript
// Simple array format
[3000, 3001, "3002-3009", "http"]

// Transforms through 5 steps to:
{
  "Port Monitor": {
    "ports": [3000, 3001, ...3009, 80],
    "autoKill": false,
    "logLevel": "info"
  }
}
```

### Key Design Principles

1. **Zero Dependencies**: Security-focused design using only Node.js built-ins
2. **Intelligent Defaults**: Automatic configuration transformation
3. **Pattern Matching**: Flexible port labeling with glob patterns
4. **Real-time Updates**: Event-driven status bar updates

## Testing Strategy

Tests are in `__tests__/` directory. Run single test files:
```bash
npm test -- __tests__/config.test.ts
```

Key test areas:
- Configuration validation and transformation
- Pattern matching and label resolution
- Port monitoring functionality
- Port emoji configuration and display modes
- Process detection and prioritization
- Edge cases and error handling

## VS Code Integration Points

1. **Settings**: 
   - `portMonitor.hosts` - Port and host configurations
   - `portMonitor.portEmojis` - Custom emojis for port labels
   - `portMonitor.emojiMode` - Emoji display mode (prefix/replace/suffix)
2. **Commands**: 
   - `portMonitor.showPortSelector`: Open port selector with process details
   - `portMonitor.showLog`: Show process details and actions
   - `portMonitor.refresh`: Refresh port status
   - `portMonitor.openSettings`: Open extension settings
3. **Status Bar**: Real-time port status display with clickable process selection
4. **Activation**: On VS Code startup (`onStartupFinished`)

## Development Notes

- TypeScript strict mode is enabled
- No ESLint/Prettier config - use VS Code formatting
- Source maps enabled for debugging
- Jest with ts-jest for testing
- Build output goes to `out/` directory

## Common Development Tasks

When adding new features:
1. Update types in `types.d.ts`
2. Add tests in `__tests__/`
3. Update configuration processing if needed
4. Test with `npm run compile && npm test`

For debugging:
1. Use VS Code's "Run Extension" launch config
2. Check Developer Tools console for errors
3. Monitor status bar for real-time updates