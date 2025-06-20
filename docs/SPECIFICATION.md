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
- ✅ **Multiple host/port simultaneous monitoring** - Feature not available in existing extensions
- ✅ **Real-time status display** - Continuous monitoring in status bar
- ✅ **Port labeling feature** - Management with human-readable names
- ✅ **Glob pattern matching** - Flexible label configuration
- ✅ **Visual status display** - Emoji and compact display

## 📋 Feature Specification

### Monitoring Targets
- Can monitor multiple hosts and multiple ports simultaneously
- Ports can be specified as:
  - Number: `3000`
  - Range: `"3000-3009"`
  - Well-known names: `"http"`, `"https"`, `"ssh"`, `"postgresql"`, etc.
- Ports can be labeled (named):
  - Set as `"port_number": "label_name"` in `portLabels`
  - Displayed as `label:port_suffix` format (e.g., `user:0` for port 3000 with user label)

### Display Format
- Displayed in status bar in the following format:
  ```
  localhost: 300[🟢user:0|🔴car:1|🔴2|🔴3|🟢4]
  db-server.local: [🔴postgresql:5432]
  ```
- Port suffix/full number display format and icons (🟢🔴) are customizable
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
    "localhost": ["http", 3000, "3001-3003", "https"],
    "db-server.local": ["postgresql"]
  },
  "portMonitor.statusIcons": {
    "open": "🟢",
    "closed": "🔴"
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

### Configuration Details
| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `portMonitor.hosts` | Object | Monitored hosts and ports | `{}` |
| `portMonitor.statusIcons` | Object | Status icon configuration | `{"open": "🟢", "closed": "🔴"}` |
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
    "localhost": [3000, 3001, "3002-3004"]
  },
  "portMonitor.portLabels": {
    "3000": "user",
    "3001": "car"
  }
}
```

### Display Customization Example
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 5432, 8080],
    "api-server": [9000, 9001]
  },
  "portMonitor.displayOptions": {
    "separator": " • ",              // Change separator character
    "showFullPortNumber": true,      // Show full port numbers
    "compactRanges": false           // Disable range compression
  }
}
```

**Display Examples**:
- Default: `localhost: 300[🟢user:0|🔴car:1|🔴2]`
- Custom: `localhost: [🟢user:3000 • 🔴car:3001 • 🔴3002]`
- Single port: `db-server: [🔴postgresql:5432]`

### Pattern Matching Example
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3009", "8000-8009"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",    // Port 3000 is "main-app"
    "300*": "dev-env",     // 3001-3009 are "dev-env"
    "800*": "test-env",    // 8000-8009 are "test-env"
    "*": "unknown"         // Others are "unknown"
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
- Port 3000 open: `🟢user:0`
- Port 3001 closed: `🔴car:1`  
- Port 3002 without label: `🔴2`
- Result: `localhost: 300[🟢user:0 🔴car:1 🔴2 🔴3 🟢4]`

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

### Implementation Tasks
- [ ] `config.ts`: Configuration loading & validation (including port label feature)
- [ ] `portRange.ts`: Port range & name resolution ("3000-3005", "http" → [80,3000,3001,...,3005])
- [ ] `monitor.ts`: Status check using tcp-port-used (host + port)
- [ ] `extension.ts`: Status bar display (aggregate by host, support label display)
- [ ] `labelResolver.ts`: Port label resolution (port number → display name conversion, pattern matching support)
- [ ] `patternMatcher.ts`: Glob pattern matching functionality
- [ ] `processManager.ts`: Process kill functionality (PID search, safe termination)
- [ ] `logViewer.ts`: Process log display (stdout/stderr real-time display)
- [ ] `processTracker.ts`: Process tracking & monitoring (PID → process details)
- [ ] `menuProvider.ts`: Context menu functionality
- [ ] Extension build, `.vsix` generation, signing process (optional)
