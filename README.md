# VSCode Port Monitor

[![Visual Studio Marketplace](https://img.shields.io/badge/Visual%20Studio-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)


A VS Code extension for real-time monitoring of multiple host and port statuses in the status bar.
Features intelligent configuration processing that automatically handles simple arrays, complex grouped configurations, well-known port names, and port ranges.


## ✨ Key Features

- 🔍 **Multi-host & multi-port monitoring**
- 🏷️ **Labeled port display** (configurable labels in settings)
- 📊 **Real-time status display** (status bar)
- 🛑 **Force kill processes** (one-click kill process using the port)
- 📺 **Log viewer** (display process stdout/stderr)
- ⚙️ **Flexible configuration** (port ranges and well-known port names supported)
- 🎨 **Customizable** (icons and monitoring intervals)

## 📸 Screenshots

```
localhost: 300[🟢user:0|⚪️car:1|⚪️2|⚪️3|🟢4]
db-server.local: [⚪️postgresql:5432]
api-server: [🟢9000|⚪️9001]
```


## 🚀 Quick Start

### 1. Installation
Install "Port Monitor" from the VS Code extension marketplace.

### 2. Configuration Formats

This extension supports multiple configuration formats that are automatically processed:

#### Simple Array Format
```json
{
  "portMonitor.hosts": {
    "Next.js": [3000, 3001, "3002-3009"]
  }
}
```

#### Grouped Configuration Format
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Next.js": {
        3000: "app",
        3001: "api",
        "3002-3009": "etc"
      },
      "Web": ["http", "https"]
    },
    "127.0.0.1": {
      "Services": ["ssh", "postgresql"],
      "Development": [8080, "8081-8090"]
    }
  }
}
```

#### Well-Known Port Names
```json
{
  "portMonitor.hosts": {
    "Web Services": ["http", "https", "ssh"],
    "Database": ["postgresql", "mysql", "redis"]
  }
}
```

### 3. See Results
Results are displayed in the status bar like `[🟢admin:3000|🟢app:3001|⚪️user:3002]`.

- 🟢 = Port is open (service running)
- ⚪️ = Port is closed (service stopped)



## 📋 Configuration Examples

### Automatic Configuration Processing

The extension uses a 4-step intelligent processing system:

1. **Well-known ports replacement**: `"http"` → `80`, `"https"` → `443`, etc.
2. **Default grouping**: Simple arrays get wrapped in `"__NOTITLE"` group
3. **Range expansion**: `"3002-3009"` → individual ports `3002, 3003, 3004...`
4. **Array to object conversion**: `[3000, 3001]` → `{3000: "", 3001: ""}`

### Multiple Servers + Background Color
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Frontend": {
        3000: "frontend",
        3001: "backend"
      }
    },
    "db-server": {
      "Database": {
        5432: "postgres",
        6379: "redis"
      }
    }
  },
  "portMonitor.backgroundColor": "statusBarItem.warningBackground"
}
```

### Mixed Configuration with Well-Known Ports
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Development": ["3000-3009", "8080"],
      "Web Services": ["http", "https"]
    },
    "production": {
      "Services": ["ssh", "postgresql"]
    }
  },
  "portMonitor.portColors": {
    "3000": "#ffcccc",
    "80": "#ccffcc",
    "8080": "statusBarItem.errorBackground"
  }
}
```

### Pattern Match Labels (Advanced)
```json
{
  "portMonitor.hosts": {
    "Development": ["3000-3009", "8080"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",     // 3000 only
    "300*": "dev-env",      // 3001-3009
    "8080": "proxy",        // 8080
    "*": "service"          // others
  }
}
```

### Custom Icons
```json
{
  "portMonitor.statusIcons": {
    "free": "⚪️",
    "inUse": "🟢"
  }
}
```

### Development Environment Example
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Frontend": {
        3000: "react",
        6006: "storybook",
        8080: "webpack"
      },
      "Backend": {
        3001: "node",
        3002: "api"
      }
    }
  }
}
```
※ Click status bar display → "Kill Process" to terminate process using the port

### Log Viewer
※ Click 🟢 icon (running process) → "Show Log" to display real-time output



## ⚙️ Configuration Options

| Setting Key | Description | Default |
|---------|-------------|---------|
| `portMonitor.hosts` | Monitored host and port targets (supports multiple formats) | `{}` |
| `portMonitor.portLabels` | Port labels (patterns supported for advanced labeling) | `{}` |
| `portMonitor.statusIcons` | Status icon settings | `{ "inUse": "🟢", "free": "⚪️" }` |
| `portMonitor.backgroundColor` | Status bar background color | none |
| `portMonitor.portColors` | Background color per port | none |
| `portMonitor.intervalMs` | Monitoring interval (ms, minimum 1000) | `3000` |
| `portMonitor.displayOptions.separator` | Port separator character | `"|"` |
| `portMonitor.displayOptions.showFullPortNumber` | Show full port numbers | `false` |
| `portMonitor.enableProcessKill` | Enable process kill feature | `true` |
| `portMonitor.enableLogViewer` | Enable log viewer | `true` |

### Port Specification Methods
- **Number**: `3000`
- **Range**: `"3000-3009"`
- **Well-known port names**: `"http"`, `"https"`, `"ssh"`, `"postgresql"`, etc.

### Configuration Processing Features
- **Automatic well-known port resolution**: `"http"`, `"https"`, `"ssh"`, `"postgresql"`, etc.
- **Port range expansion**: `"3000-3009"` automatically expands to individual ports
- **Smart grouping**: Simple arrays automatically get grouped for better organization
- **Flexible input formats**: Arrays, objects, mixed configurations all supported

### portLabels Pattern Examples (Advanced)
- `"3000"` - Exact match
- `"300*"` - Prefix match (3000, 3001, ...)
- `"*80"` - Suffix match (80, 8080, ...)
- `"30?0"` - Single character wildcard (3000, 3010, ...)
- `"*"` - All (lowest priority)



## 📝 Additional Configuration Examples

### Basic Multi-Host Setup
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Applications": {
        3000: "app",
        3001: "api",
        5432: "db"
      }
    },
    "production.example.com": {
      "Web Services": ["http", "https"]
    }
  }
}
```

### Advanced with Pattern Labels
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3009", "8080"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",
    "300*": "dev-env",
    "8080": "proxy"
  }
}
```

### Display Customization
```json
{
  "portMonitor.displayOptions": {
    "separator": " • ",
    "showFullPortNumber": true,
    "compactRanges": false
  }
}
```

**Display Examples**:
- Default: `localhost: 300[🟢0|⚪️1|⚪️2]`
- Custom: `localhost: [🟢3000 • ⚪️3001 • ⚪️3002]`
- Single port: `db-server: [⚪️postgresql:5432]`

---
※ All configuration formats are automatically processed and normalized internally for consistent behavior.


## 📚 Rich Configuration Examples

For more configuration examples for various development environments, see:
- **[examples/SAMPLE_CONFIGURATIONS.md](./examples/SAMPLE_CONFIGURATIONS.md)** - 50+ framework & technology-specific samples
- **[examples/USE_CASE_EXAMPLES.md](./examples/USE_CASE_EXAMPLES.md)** - 10 practical scenario examples

Supported development environments include:
- **Frontend**: Next.js, React, Vue.js, Angular, Svelte
- **Backend**: Express, NestJS, Django, Flask, Spring Boot
- **Database**: PostgreSQL, MySQL, MongoDB, Redis
- **Architecture**: Microservices, Full-stack, JAMstack
- **Use Cases**: E-commerce, SaaS, Mobile, AI/ML, Games


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


---
**Development Status**: 🚧 Currently under active development