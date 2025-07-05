# VS Code Port Monitor Extension - Installation & Testing Guide

## Generated Files

✅ **VSIX package ready for installation!**
- Current version: `vscode-port-monitor-0.3.6.vsix`
- Features: Zero dependencies, 5-step intelligent configuration processing, smart error detection
- Files included: Core functionality only (optimized for performance)

## Extension Testing Methods

### Method 1: Extension Development Host (Recommended)
1. Open this project in VS Code
2. Press F5 or run "Run Extension" from the debug view
3. A new Extension Development Host window will open
4. Add configuration and test

### Method 2: Direct installation from VSIX file (Can be used in other projects)
1. Open VS Code
2. Run "Extensions: Install from VSIX" from Command Palette (Cmd+Shift+P)
3. Select the `vscode-port-monitor-0.3.5.vsix` file
4. The extension will be installed

**✅ With this method, you can use it immediately in other projects!**

### Method 3: VS Code Command Line (if code command is available)
```bash
code --install-extension vscode-port-monitor-0.3.6.vsix
```

### 🚀 How to use in other projects
1. **Copy VSIX file**: Copy `vscode-port-monitor-0.3.6.vsix` to other project folders
2. **Install from VSIX**: Install using Method 2 above
3. **Add configuration**: Add settings to each project's `settings.json`
4. **Start using immediately**: Port monitoring will start in the status bar

**💡 Tip**: Once installed, it becomes available throughout VS Code.

## Test Configuration Examples

### Next.js Development Environment (v0.3.6 - 5-Step Processing)
Add the following to your settings file (settings.json):

```json
{
  "portMonitor.hosts": {
    "Next.js Development": ["3000-3009"],
    "Database": ["postgresql", "redis", "mongodb"],
    "Testing Tools": [6006, 4000, 8080]
  },
  "portMonitor.portLabels": {
    "3000": "Next.js Main",
    "3001": "Next.js Dev",
    "3002": "Next.js Test",
    "300*": "Next.js",
    "5432": "PostgreSQL",
    "6379": "Redis", 
    "27017": "MongoDB",
    "6006": "Storybook",
    "4000": "GraphQL Playground",
    "8080": "API Gateway"
  },
  "portMonitor.statusIcons": {
    "inUse": "🟢",
    "free": "🔴"
  },
  "portMonitor.displayOptions": {
    "separator": "|",
    "showFullPortNumber": false,
    "compactRanges": true
  },
  "portMonitor.intervalMs": 3000,
  "portMonitor.statusBarPosition": "right"
}
```

### Simple Development Environment
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "frontend",
      "3001": "backend", 
      "5432": "database"
    }
  }
}
```

### ⚠️ Common Configuration Mistakes (v0.3.6)

The extension now detects and provides helpful error messages for common mistakes:

#### ❌ Incorrect: Reversed port-label configuration
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "frontend": 3000,
      "backend": 3001
    }
  }
}
```
**Error**: `Port numbers should be keys, not values. Current: {"frontend": 3000} Correct: {"3000": "frontend"}`

#### ✅ Correct: Port as key, label as value
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "frontend",
      "3001": "backend"
    }
  }
}
```

#### ❌ Incorrect: Empty host name
```json
{
  "portMonitor.hosts": {
    "": {
      "3000": "app"
    }
  }
}
```
**Error**: `Empty host name detected. Use "localhost" instead of ""`

#### ✅ Correct: Proper host name
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "app"
    }
  }
}
```

### Multi-Server Environment
```json
{
  "portMonitor.hosts": {
    "Development": {
      "localhost": [3000, 3001, 8080]
    },
    "Database": {
      "db-server": [5432, 6379]
    },
    "Production": {
      "api.example.com": [80, 443]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Frontend",
    "3001": "Backend API",
    "8080": "Dev Proxy",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "80": "HTTP",
    "443": "HTTPS"
  }
}
```

## Expected Display Examples

When configured correctly, you should see displays like:

### Compact Range Display
```
Next.js Development: 300[🟢:0|🔴:1|🔴:2|🔴:3|🔴:4|🔴:5|🔴:6|🔴:7|🔴:8|🔴:9]
Database: [🔴PostgreSQL:5432|🔴Redis:6379|🔴MongoDB:27017]
Testing Tools: [🔴Storybook:6006|🔴GraphQL:4000|🔴API:8080]
```

### Simple Mode Display
```
localhost: [🟢frontend:3000|🟢backend:3001|🔴database:5432]
```

### Category-based Display
```
Development[🟢Frontend|🟢API|🔴Proxy] Database[🔴PostgreSQL|🔴Redis] Production[🔴HTTP|🔴HTTPS]
```

## Verification Steps

1. **Installation Check**
   - Verify the extension appears in the extensions list
   - Check that "Port Monitor" is displayed in the status bar

2. **Configuration Test**
   - Add the test configuration to `settings.json`
   - Verify that port monitoring displays appear in the status bar
   - Check that status changes when starting/stopping services

3. **Functionality Test**
   - Click on port displays to test context menu
   - Test process kill functionality (if enabled)
   - Test log viewer functionality (if enabled)

4. **Performance Test**
   - Monitor that CPU usage doesn't increase significantly
   - Verify that VS Code remains responsive during monitoring

## Troubleshooting

### Extension not appearing
- Check if installation was successful
- Restart VS Code
- Check the VS Code output panel for error messages

### No port displays appearing
- Verify configuration syntax is correct (check for reversed port-label configuration)
- Check that the ports are actually being used
- Verify intervalMs setting (minimum 1000ms)
- Look for "Configuration Error" in status bar for detailed error messages

### Performance issues
- Increase intervalMs value
- Reduce the number of monitored ports
- Check network connectivity for remote hosts

## Development Testing

### Running Tests
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Building Extension
```bash
# Compile TypeScript
npm run compile

# Package extension
npm run package
```

### Debugging
1. Open project in VS Code
2. Set breakpoints in source code
3. Press F5 to start debugging
4. Test functionality in Extension Development Host

## Advanced Configuration

### Custom Status Icons
```json
{
  "portMonitor.statusIcons": {
    "inUse": "🟢",
    "free": "⚪️"
  }
}
```

### Display Customization
```json
{
  "portMonitor.displayOptions": {
    "separator": " • ",
    "showFullPortNumber": true,
    "compactRanges": false,
    "maxDisplayLength": 200
  }
}
```

### Process Management & Status Bar Position
```json
{
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true,
  "portMonitor.enableLogViewer": true,
  "portMonitor.statusBarPosition": "left"
}
```

## New Features in v0.3.6

### 🔧 5-Step Configuration Processing
- **Step-by-step processing**: Each transformation is handled individually for better maintainability
- **Individual step testing**: Each processing step can be tested independently
- **Better error isolation**: Issues are easier to identify and fix in specific steps
- **Improved reliability**: Systematic approach reduces bugs and edge cases

### 📍 Status Bar Positioning  
- **Configurable position**: Choose left or right alignment
- **Instant updates**: Changes take effect immediately without restart
- **Setting**: `"portMonitor.statusBarPosition": "left"` or `"right"`

### 🏷️ Enhanced Group Name Handling
- **Hidden system groups**: `__NOTITLE` prefixed groups don't show in display
- **Multiple unnamed groups**: Support for `__NOTITLE1`, `__NOTITLE2`, etc.
- **Cleaner display**: Removes clutter from status bar

### 🔧 Smart Configuration Error Detection
- **Automatic error detection**: Detects common configuration mistakes
- **Helpful error messages**: Shows specific fix suggestions in status bar tooltip
- **Real-time validation**: Errors are detected as you type in settings