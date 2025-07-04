# VS Code Port Monitor Extension - Installation & Testing Guide

## Generated Files

✅ **VSIX package ready for installation!**
- Current version: `vscode-port-monitor-0.3.3.vsix`
- Features: Zero dependencies, 4-step intelligent configuration processing
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
3. Select the `vscode-port-monitor-0.3.3.vsix` file
4. The extension will be installed

**✅ With this method, you can use it immediately in other projects!**

### Method 3: VS Code Command Line (if code command is available)
```bash
code --install-extension vscode-port-monitor-0.3.3.vsix
```

### 🚀 How to use in other projects
1. **Copy VSIX file**: Copy `vscode-port-monitor-0.3.3.vsix` to other project folders
2. **Install from VSIX**: Install using Method 2 above
3. **Add configuration**: Add settings to each project's `settings.json`
4. **Start using immediately**: Port monitoring will start in the status bar

**💡 Tip**: Once installed, it becomes available throughout VS Code.

## Test Configuration Examples

### Next.js Development Environment (v0.3.3 - Intelligent Processing)
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
  "portMonitor.intervalMs": 3000
}
```

### Simple Development Environment
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "frontend": 3000,
      "backend": 3001,
      "database": 5432
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
- Verify configuration syntax is correct
- Check that the ports are actually being used
- Verify intervalMs setting (minimum 1000ms)

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

### Process Management
```json
{
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true,
  "portMonitor.enableLogViewer": true
}
```