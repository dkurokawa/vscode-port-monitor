# VSCode Port Monitor - Detailed Specification

## 🎯 Project Uniqueness

### Competitive Analysis
Comparison with existing VS Code extensions:

| Extension | Feature | Difference from ours |
|----------|---------|---------------------|
| `piyush-bhatt.vscode-port` | Port availability check | One-time check only, no real-time monitoring |
| `ms-vscode.vscode-serial-monitor` | Serial port monitoring | Serial communication focused, no TCP/IP port monitoring |
| `mutantdino.resourcemonitor` | System resource monitoring | CPU/memory only, no port status |
| `njzy.stats-bar` | System statistics display | Network speed only, no port monitoring |

### Unique Value
- ✅ **Intelligent configuration processing** - 5-step automatic transformation of any input format
- ✅ **Zero external dependencies** - Native Node.js implementation for better security
- ✅ **Multiple host/port simultaneous monitoring** - Feature not available in existing extensions
- ✅ **Real-time status display** - Continuous monitoring in status bar
- ✅ **Port labeling feature** - Management with human-readable names
- ✅ **Glob pattern matching** - Flexible label configuration
- ✅ **Visual status display** - Emoji and compact display

## 📋 Feature Specification

### Monitoring Targets
- Can monitor multiple hosts and multiple ports simultaneously
- Supports multiple configuration formats that are automatically processed:
  - **Simple arrays**: `[3000, 3001, "3002-3009"]`
  - **Grouped configurations**: `{"Development": {"3000": "app", "__CONFIG": {...}}}`
  - **Mixed formats**: Arrays with well-known names and ranges
- Ports can be specified as:
  - Number: `3000`
  - Range: `"3000-3009"`
  - Well-known names: `"http"`, `"https"`, `"ssh"`, `"postgresql"`, etc.
- **Intelligent Configuration Processing**: 5-step automatic transformation:
  1. **Well-known ports replacement**: `"http"` → `80`, `"https"` → `443`, etc.
  2. **Port range expansion**: `"3002-3009"` → individual ports `3002, 3003, 3004...`
  3. **Smart default grouping**: Simple arrays get `"__NOTITLE"` wrapper for organization
  4. **Array to object conversion**: `[3000, 3001]` → `{"3000": "", "3001": ""}` for consistent processing
  5. **Structure normalization**: Validate and clean final configuration format
- Group-level configuration with `__CONFIG` key:
  - `compact`: Enable compact display for port ranges
  - `bgcolor`: Background color for the group
  - `separator`: Custom separator character
  - `show_title`: Whether to show group title
- Port labeling:
  - Direct assignment in grouped format: `{"3000": "app", "3001": "api"}`
  - Pattern-based via `portLabels`: `{"300*": "dev-env"}`
  - Displayed as `label:port_suffix` format
- Group configuration options:
  - `__CONFIG` key within groups for display settings
  - Supports `compact`, `bgcolor`, `separator`, `show_title` options

### Display Format
- Displayed in status bar in the following format:
  ```
  localhost: 300[🟢user:0|⚪️car:1|⚪️2|⚪️3|🟢4]
  db-server.local: [⚪️postgresql:5432]
  ```
- Port suffix/full number display format and icons (🟢⚪️) are customizable
- When a port has a label, displayed as "label:port_suffix" format
- Non-range ports also display full port numbers
- Port separator character (default: `|`) is customizable

### Interaction Features
- **Status bar item click** - Display port management menu
- **Context menu**:
  - 🔄 **Refresh** - Manually re-check port status
  - 🛑 **Kill process** - Stop process running on selected port
  - 📺 **Show logs** - Real-time display of process stdout/stderr output
  - 📊 **Process details** - Detailed information like PID, command, execution time
  - ⚙️ **Open settings** - Open portMonitor settings screen
  - 📋 **Show details** - Display port detailed information in panel

## ⚙️ Configuration

### Basic Configuration
```json
{
  "portMonitor.hosts": {
    "Web Services": {
      "80": "http",
      "443": "https",
      "__CONFIG": {
        "compact": true,
        "show_title": true
      }
    },
    "Development": {
      "3000": "main-app",
      "3001": "api-server",
      "3002": "test-env",
      "3003": "staging"
    }
  },
  "portMonitor.statusIcons": {
    "inUse": "🟢",
    "free": "⚪️"
  },
  "portMonitor.intervalMs": 3000,
  "portMonitor.portLabels": {
    "3000": "user",
    "3001": "car"
  },
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true,
  "portMonitor.enableLogViewer": true,
  "portMonitor.logBufferSize": 1000,
  "portMonitor.autoScrollLog": true,
  "portMonitor.displayOptions": {
    "separator": "|",
    "showFullPortNumber": false,
    "compactRanges": true
  }
}
```

### Alternative Simple Configuration
```json
{
  "portMonitor.hosts": {
    "Development": [3000, 3001, "3002-3009"],
    "Services": ["http", "https", "ssh"]
  }
}
```

### Group Configuration with __CONFIG
```json
{
  "portMonitor.hosts": {
    "Development": {
      "3000": "react-app",
      "3001": "vue-app",
      "3007": "test-server",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#ffcccc",
        "separator": "|",
        "show_title": false
      }
    },
    "Database": {
      "5432": "postgres",
      "6379": "redis"
    }
  }
}
```

### Configuration Details
| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `portMonitor.hosts` | Object | Monitored hosts and ports | `{}` |
| `portMonitor.statusIcons` | Object | Status icon configuration | `{"inUse": "🟢", "free": "⚪️"}` |
| `portMonitor.intervalMs` | Number | Monitoring interval (milliseconds) | `3000` |
| `portMonitor.portLabels` | Object | Port label configuration (pattern matching support) | `{}` |
| `portMonitor.enableProcessKill` | Boolean | Enable process kill feature | `true` |
| `portMonitor.confirmBeforeKill` | Boolean | Show confirmation dialog before killing process | `true` |
| `portMonitor.enableLogViewer` | Boolean | Enable process log viewer feature | `true` |
| `portMonitor.logBufferSize` | Number | Log buffer size (number of lines) | `1000` |
| `portMonitor.autoScrollLog` | Boolean | Auto-scroll logs | `true` |
| `portMonitor.displayOptions.separator` | String | Separator character between ports | `"|"` |
| `portMonitor.displayOptions.showFullPortNumber` | Boolean | Show full port numbers | `false` |
| `portMonitor.displayOptions.compactRanges` | Boolean | Compact range display (3000-3009→300[0-9]) | `true` |
| `portMonitor.statusBarPosition` | String | Status bar position ("left" or "right") | `"right"` |

### Port Label Pattern Matching
The following patterns are available in `portMonitor.portLabels`:

| Pattern | Description | Example |
|---------|-------------|---------|
| `"3000"` | Exact match | Port 3000 only |
| `"300*"` | Prefix match | 3000, 3001, 3002... |
| `"*000"` | Suffix match | 3000, 4000, 5000... |
| `"30?0"` | Single character wildcard | 3000, 3010, 3020... |
| `"*"` | All ports | All unconfigured ports |

### Pattern Priority
1. **Exact match** - Highest priority
2. **Specific patterns** - More specific patterns take precedence
3. **Wildcards** - Lowest priority

```json
{
  "portMonitor.portLabels": {
    "3000": "frontend",     // Exact match (highest priority)
    "300*": "dev-services", // Applied to 3001, 3002...
    "*": "unknown"          // All others (lowest priority)
  }
}
```

## 🚫 Limitations
- `intervalMs` must be ≥1000ms (prevents overload)
- Maximum 100 ports after expansion
- Port numbers must be within `1-65535` range, `0` or negative values are invalid
- `WELL_KNOWN_PORTS` are internally defined and extensible
- **Process kill feature**:
  - Only supports localhost (cannot kill processes on remote hosts)
  - May not be able to kill processes requiring administrator privileges
  - System process termination is restricted for safety
- **Log viewer feature**:
  - Only supports localhost processes
  - For already running processes, only logs from monitoring start time are available
  - Some processes (daemons, services) may not provide logs
  - Old logs exceeding buffer size are automatically deleted

## 💡 Usage Examples

### Basic Configuration Example
```json
{
  "portMonitor.hosts": {
    "Applications": {
      "3000": "user",
      "3001": "car",
      "3002": "services",
      "3003": "services",
      "3004": "services"
    }
  }
}
```

### Simple Array Format Example
```json
{
  "portMonitor.hosts": {
    "Development": [3000, 3001, "3002-3004"]
  },
  "portMonitor.portLabels": {
    "3000": "user",
    "3001": "car",
    "300*": "dev-services"
  }
}
```

### Display Customization Example
```json
{
  "portMonitor.hosts": {
    "Local Development": {
      "3000": "frontend",
      "5432": "database",
      "8080": "api",
      "__CONFIG": {
        "separator": " • ",
        "compact": false,
        "show_title": true
      }
    },
    "Remote APIs": {
      "9000": "auth-service",
      "9001": "user-service"
    }
  }
}
```

**Display Examples**:
- Default: `localhost: 300[🟢user:0|⚪️car:1|⚪️2]`
- Custom: `localhost: [🟢user:3000 • ⚪️car:3001 • ⚪️3002]`
- Single port: `db-server: [⚪️postgresql:5432]`

### Pattern Matching Example
```json
{
  "portMonitor.hosts": {
    "Development": ["3000-3009"],
    "Testing": ["8000-8009"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",
    "300*": "dev-env",
    "800*": "test-env",
    "*": "unknown"
  }
}
```

### Complex Pattern Example
```json
{
  "portMonitor.portLabels": {
    "3000": "frontend",         // Exact match
    "3001": "backend",          // Exact match
    "30??": "microservices",    // 3000-3099 (excluding above)
    "80*": "web-servers",       // 8000-8999
    "*443": "ssl-services",     // 443, 8443, 9443, etc.
    "*": "other"                // All others
  }
}
```

### Process Management Feature Usage Example
```json
{
  "portMonitor.enableProcessKill": true,      // Enable process kill feature
  "portMonitor.confirmBeforeKill": true,      // Show confirmation dialog before killing
  "portMonitor.enableLogViewer": true,        // Enable log viewer feature
  "portMonitor.logBufferSize": 1000,          // Log buffer size
  "portMonitor.autoScrollLog": true           // Auto-scroll
}
```

**Process Kill Usage Steps**:
1. Click the status bar display
2. Select "Kill process" from context menu
3. Select the port/process to kill
4. Click "OK" in confirmation dialog

**Log Viewer Usage Steps**:
1. Click the 🟢 icon in status bar (running processes only)
2. Select "Show logs" from context menu
3. Real-time stdout/stderr display in new tab
4. Logs auto-update, allowing error and debug info review

### Display Example
With this configuration, the display will be:
- Port 3000 in use: `🟢user:0`
- Port 3001 free: `⚪️car:1`  
- Port 3002 without label: `⚪️2`
- Result: `localhost: 300[🟢user:0 ⚪️car:1 ⚪️2 ⚪️3 🟢4]`

## 🏗️ Architecture

### Directory Structure
```
vscode-port-monitor/
├── src/
│   ├── extension.ts        # Extension entry point
│   ├── config.ts          # Configuration loading & validation
│   ├── portRange.ts       # Port range & name resolution
│   ├── monitor.ts         # Port monitoring logic
│   └── labelResolver.ts   # Port label resolution
├── package.json
├── tsconfig.json
├── .vscode/
│   └── launch.json
├── SPECIFICATION.md       # This file
└── README.md
```

## 🔧 Configuration Validation & Error Detection

### Smart Error Detection (v0.3.5)

The extension provides comprehensive configuration validation with helpful error messages:

#### Common Configuration Errors Detected

1. **Reversed Port-Label Configuration**
   - **Detection**: Values are port numbers instead of keys
   - **Error**: `Port numbers should be keys, not values. Current: {"user": 3000} Correct: {"3000": "user"}`

2. **Empty Host Name**
   - **Detection**: Host key is empty string `""`
   - **Error**: `Empty host name detected. Use "localhost" instead of ""`
   - **Auto-fix**: Automatically converts empty hosts to `"localhost"`

3. **Host Name as Port Number**
   - **Detection**: Host name looks like a port number
   - **Error**: `Host "3000": Host name looks like a port number. Use "localhost" or proper hostname`

4. **Mixed Configuration Format**
   - **Detection**: Both port-as-key and port-as-value in same configuration
   - **Error**: `Mixed configuration detected. Use consistent format`

5. **Invalid Port Range Syntax**
   - **Detection**: Port ranges in wrong format or location
   - **Error**: `Port range "3000-3005" detected. Use array format: {"group": ["3000-3005"]}`

#### Error Display
- **Status Bar**: Shows "Port Monitor: Configuration Error" when errors detected
- **Tooltip**: Displays detailed error messages with fix suggestions
- **Examples**: Provides correct configuration format for each error type

### Status Bar Positioning

Configure status bar position:
```json
{
  "portMonitor.statusBarPosition": "left"  // or "right" (default)
}
```

Changes take effect immediately without requiring VS Code restart.

### Implementation Status (v0.3.5)
- ✅ **`config.ts`**: Enhanced configuration processing with detailed validation
- ✅ **`monitor.ts`**: Native Node.js port checking (zero dependencies)
- ✅ **`extension.ts`**: Status bar display with error handling and positioning
- ✅ **`labelResolver.ts`**: Pattern-based port label resolution
- ✅ **`patternMatcher.ts`**: Glob pattern matching functionality
- ✅ **Configuration validation**: Smart error detection with helpful messages
- ✅ **Status bar positioning**: Configurable left/right alignment
- ✅ **Group name handling**: Hide `__NOTITLE` prefixed group names
- 🚧 **`processManager.ts`**: Process kill functionality (basic implementation)
- 🚧 **`logViewer.ts`**: Process log display (basic implementation)
- 📋 **Future enhancements**:
  - Advanced process tracking & monitoring
  - Enhanced context menu functionality
  - VS Code Marketplace publication
