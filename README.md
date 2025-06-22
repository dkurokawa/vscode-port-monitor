# VSCode Port Monitor

[![Visual Studio Marketplace](https://img.shields.io/badge/Visual%20Studio-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A VS Code extension for real-time monitoring of multiple hosts and ports with status display in the status bar.

## ✨ Features

- 🔍 **Multi-host & Multi-port Monitoring** - Monitor multiple servers and local ports simultaneously
- 🏷️ **Port Labeling** - Assign meaningful names to ports for easy management
- 📊 **Real-time Display** - Visual status display in VS Code status bar
- 🛑 **Process Management** - Stop processes using ports with one click
- 📺 **Log Viewer** - View real-time stdout/stderr output from processes
- ⚙️ **Flexible Configuration** - Support for port ranges and well-known port names
- 🎨 **Customizable** - Configure display icons and monitoring intervals

## 📸 Screenshots

```
localhost: 300[🟢user:0|🔴car:1|🔴2|🔴3|🟢4]
db-server.local: [🔴postgresql:5432]
api-server: [🟢9000|🔴9001]
```

## 🚀 Quick Start

### 1. Installation
Install "Port Monitor" from the VS Code Extensions Marketplace.

### 2. Basic Configuration
Add this to your VS Code settings (File → Preferences → Settings → Open JSON):

```json
{
  "portMonitor.hosts": {
    "localhost": {
      "admin": 3000,
      "app": 3001,
      "user": 3002
    }
  }
}
```

### 3. See Results
You'll see this in your status bar: `[🟢admin:3000|🟢app:3001|🔴user:3002]`

- 🟢 = Port is open (service running)
- 🔴 = Port is closed (service not running)

## 📋 Configuration Examples

### Multiple Servers
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "frontend": 3000,
      "backend": 3001
    },
    "db-server": {
      "postgres": 5432,
      "redis": 6379
    }
  }
}
```

### Custom Icons
```json
{
  "portMonitor.statusIcons": {
    "open": "✅",
    "closed": "❌"
  }
}
```

### Development Environment
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "react": 3000,
      "node": 3001,
      "webpack": 8080,
      "storybook": 6006
    }
  }
}
```
- Click status bar display
- Select "Kill Process" from context menu
- Choose the port/process to terminate

### 5. Log Viewer
- Click 🟢 icon (running process)
- Select "Show Log" to view real-time stdout/stderr output

## ⚙️ Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `portMonitor.hosts` | Hosts and ports to monitor | `{}` |
| `portMonitor.portLabels` | Port labels with pattern matching support | `{}` |
| `portMonitor.statusIcons` | Status icon configuration | `{"open": "🟢", "closed": "🔴"}` |
| `portMonitor.intervalMs` | Monitoring interval in milliseconds (minimum 1000) | `3000` |
| `portMonitor.displayOptions.separator` | Separator between ports | `"|"` |
| `portMonitor.displayOptions.showFullPortNumber` | Show full port numbers | `false` |
| `portMonitor.enableProcessKill` | Enable process kill functionality | `true` |
| `portMonitor.enableLogViewer` | Enable process log viewer | `true` |

### Port Specification Methods
- **Number**: `3000`
- **Range**: `"3000-3009"`
- **Well-known names**: `"http"`, `"https"`, `"ssh"`, `"postgresql"`, etc.

## 📝 Configuration Examples

### Basic Usage
```json
{
  "portMonitor.hosts": {
    "localhost": [8080, 3000, "5432"],
    "production.example.com": ["http", "https"]
  }
}
```

### Labeled Port Monitoring
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 3001, 3002]
  },
  "portMonitor.portLabels": {
    "3000": "frontend",
    "3001": "backend", 
    "3002": "database"
  }
}
```

### Pattern Matching Labels
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3009", "8080"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",     // 3000 specifically labeled as main-app
    "300*": "dev-env",      // 3001-3009 labeled as dev-env
    "8080": "proxy",        // 8080 labeled as proxy
    "*": "service"          // Others labeled as service
  }
}
```

### Available Patterns
- `"3000"` - Exact match
- `"300*"` - Prefix match (3000, 3001, 3002...)
- `"*80"` - Suffix match (80, 8080, 3080...)
- `"30?0"` - Single character wildcard (3000, 3010, 3020...)
- `"*"` - All ports (lowest priority)

### Process Management
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3005", "8080"]
  },
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true
}
```

**How to use**:
1. Click 🟢 or 🔴 icon in status bar
2. Select "Kill Process" menu
3. Choose the port/process to stop
4. Confirm to safely terminate the process

### Log Viewer
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000", "8080"]
  },
  "portMonitor.enableLogViewer": true,
  "portMonitor.logBufferSize": 1000,
  "portMonitor.autoScrollLog": true
}
```

### Display Customization
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 5432, 8080]
  },
  "portMonitor.displayOptions": {
    "separator": " • ",              // Customize separator
    "showFullPortNumber": true,      // Show full port numbers
    "compactRanges": false           // Disable range compression
  }
}
```

**Display Examples**:
- Default: `localhost: 300[🟢0|🔴1|🔴2]`
- Custom: `localhost: [🟢3000 • 🔴3001 • 🔴3002]`
- Single port: `db-server: [🔴postgresql:5432]`

**How to use**:
1. Click 🟢 icon (running process)
2. Select "Show Log" menu
3. View real-time stdout/stderr output in new tab
4. Monitor error logs, debug info, access logs, etc.

## 📚 Rich Configuration Examples

Various configuration examples for different development environments:

### Next.js Development Environment (Recommended)
```json
{
  "portMonitor.hosts": {
    "Next.js Development": {
      "localhost": [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Main App",
    "3001": "Admin Panel",
    "3002": "Storybook",
    "3003-3009": "Feature Branches"
  }
}
```

### Detailed Configuration Examples
- **[examples/SAMPLE_CONFIGURATIONS.md](./examples/SAMPLE_CONFIGURATIONS.md)** - 50+ framework and technology-specific configurations
- **[examples/USE_CASE_EXAMPLES.md](./examples/USE_CASE_EXAMPLES.md)** - 10 practical development scenario configurations

Supported Development Environments:
- **Frontend**: Next.js, React, Vue.js, Angular, Svelte
- **Backend**: Express, NestJS, Django, Flask, Spring Boot
- **Database**: PostgreSQL, MySQL, MongoDB, Redis
- **Architecture**: Microservices, Full-stack, JAMstack
- **Use Cases**: E-Commerce, SaaS, Mobile, AI/ML, Gaming

## 🔧 Developer Information

### Requirements
- Node.js 14.x or higher
- VS Code 1.60.0 or higher

### Local Development
```bash
# Clone repository
git clone https://github.com/dkurokawa/vscode-port-monitor.git
cd vscode-port-monitor

# Install dependencies
npm install

# Build for development
npm run compile

# Debug execution
# Press F5 to launch Extension Development Host
```

## 🐛 Bug Reports & Feature Requests

For bug reports or feature requests, please create an issue on [GitHub Issues](https://github.com/dkurokawa/vscode-port-monitor/issues).

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Pull requests and issues are welcome! See [docs/SPECIFICATION.md](docs/SPECIFICATION.md) for details.

---

**Development Status**: 🚧 Currently under active development