# Next Tasks

## Current Status

1. **Completed Work**
   - ✅ Investigated bgcolor not being applied issue
   - ✅ Attempted to change from bgcolor to textcolor, but didn't work due to VS Code limitations
   - ✅ Removed textcolor feature
   - ✅ Removed global backgroundColor
   - ✅ Added debug logs for compact display issue investigation

2. **Current Issues**
   - Compact display may not work correctly in some cases
   - Debug logs have been added but root cause not yet identified

## Next Actions

### 1. Fix Compact Display Issues
Identify and fix problems from debug logs:

```
[PortMonitor] buildTemplate - isCompact: 
[PortMonitor] Compact display - commonPrefix:
[PortMonitor] processCompactDisplays - result:
```

### 2. Points to Check
- Is `__CONFIG` with `compact: true` being loaded correctly?
- Is the common prefix calculation logic correct?
- Is the replacement process in `processCompactDisplays` working correctly?

### 3. Related Files
- `/src/extension.ts` - Debug logs added (lines 245-262, 277-300, 389-440)
- `/src/config.ts` - GroupConfigs interface (lines 12-16)

### 4. Test Cases
Test compact display with the following settings:
```json
{
  "portMonitor.hosts": {
    "Frontend": {
      "3000": "app",
      "3001": "api",
      "3002": "web",
      "__CONFIG": {
        "compact": true,
        "separator": "|"
      }
    }
  }
}
```

Expected display: `Frontend: 300[🟢app:0|🟢api:1|🟢web:2]`

## Debug Steps
1. Run the extension
2. Open Developer Tools (Help > Toggle Developer Tools)
3. Check logs in Console tab
4. Trace compact display processing flow
5. Identify problem area and fix