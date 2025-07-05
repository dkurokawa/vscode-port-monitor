# Port Monitor - Development Test Settings (v0.3.6)

Test configuration examples showcasing the new 5-step intelligent configuration processing with zero dependencies.

## Expected Display Examples

### Basic Format Display (Mixed Labels and Sequential Numbers)
```
localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]
```

### Category-Based Format Display (Mixed Labels and Numbers)
```
localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9] Web:[🔴http:80|🔴https:443]]
127.0.0.1[Services:[🔴ssh:22|🔴postgresql:5432] Development:808[🔴:0|🔴:1|🔴:2|🔴:3|🔴:4|🔴:5|🔴:6|🔴:7|🔴:8|🔴:9]]
```

### When Common Prefix is 3 Characters ([3000,3001,3007,3008,3009])
```
localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]
```

### When Common Prefix is 2 Characters ([3000,3001,4000])
```
localhost:30[🟢main:00|🟢dev:01|🔴4000]
```

### When There is No Common Prefix
```
localhost:[🟢main:3000|🟢dev:3001|🔴8080|🔴9000]
```## 5-Step Configuration Processing (v0.3.6)

The extension now uses a systematic 5-step processing approach for better maintainability and testability:

1. **Step 1**: Replace well-known port names with port numbers
2. **Step 2**: Expand port ranges (e.g., "3000-3005" → individual ports)
3. **Step 3**: Add default group wrapper for ungrouped configurations
4. **Step 4**: Convert port arrays to port-label objects
5. **Step 5**: Normalize structure and validate final format

## Basic Format (Simple Array - v0.3.6)
```json
{
  "portMonitor.hosts": {
    "Development": [3000, 3001, "3002-3005", "http", "https"],
    "Services": ["ssh", "postgresql"]
  }
}
```
**Note**: Simple arrays automatically get wrapped with "__NOTITLE" group during Step 3 processing.

### Category-Based Format (v0.3.6 - 5-Step Processing)
```json
{
  "portMonitor.hosts": {
    "Next.js": [3000, 3001, "3002-3009"],
    "Web Services": ["http", "https"],
    "Remote Services": {
      "Services": ["ssh", "postgresql"],
      "Development": ["8080-8090"]
    }
  }
}
```

### Mixed Format (v0.3.6 - All Formats Supported)
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Next.js": [3000, 3001, "3002-3009"],
      "Web": ["http", "https"]
    },
    "production.server": [22, 80, 443],
    "127.0.0.1": ["ssh", "postgresql"]
  },
  "portMonitor.portLabels": {
    "3000": "frontend",
    "3001": "backend",
    "300*": "dev-env",
    "80": "web",
    "443": "secure-web",
    "*": "other"
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
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true,
  "portMonitor.enableLogViewer": true,
  "portMonitor.logBufferSize": 1000,
  "portMonitor.autoScrollLog": true
}
```

## Test Procedure

1. Press F5 key to launch Extension Development Host
2. Add the above settings in a new VS Code window
3. Confirm that port monitoring results are displayed in the status bar
4. Click on port items to test the context menu

## Expected Display Examples

### Basic Format Display
```
localhost[frontend:[�3000] backend:[🔴3001] dev-env:300[🔴:2|🔴:3|🔴:4|🔴:5] Other:[🔴web|🔴secure-web]]
127.0.0.1[Other:[🔴ssh|🔴postgresql]]
```

### Category-Based Format Display (Sequential Number Support)
```
localhost[Next.js:[🟢3000|�3001 300[🔴:7|🔴:8|🔴:9]] Web:[🔴http:80|🔴https:443]]
127.0.0.1[Services:[🔴ssh:22|🔴postgresql:5432] Development:808[🔴:0|🔴:1|🔴:2|🔴:3|🔴:4|🔴:5|🔴:6|🔴:7|🔴:8|🔴:9]]
```

### Mixed Format Display
```
localhost[Next.js:300[🟢:0|🔴:1|🔴:2] Web:[🔴http|🔴https]]
production.server[Other:[🔴ssh|🔴web|🔴secure-web]]
127.0.0.1[Other:[🔴ssh|🔴postgresql]]
```
