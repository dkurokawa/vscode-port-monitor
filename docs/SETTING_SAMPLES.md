# Port Monitor Configuration Samples

This document provides comprehensive configuration examples for the Port Monitor extension.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Port Emoji Configuration](#port-emoji-configuration)
- [Display Customization](#display-customization)
- [Multi-Host Setup](#multi-host-setup)
- [Advanced Pattern Labels](#advanced-pattern-labels)
- [Complete Examples](#complete-examples)

## Basic Configuration

### Simple Port List
```json
{
  "portMonitor.hosts": {
    "Development": [3000, 3001, 3002]
  }
}
```

### Port Ranges
```json
{
  "portMonitor.hosts": {
    "Dev Range": ["3000-3009", 8080]
  }
}
```

### Well-known Ports
```json
{
  "portMonitor.hosts": {
    "Web Services": ["http", "https", "ssh"]
  }
}
```

## Port Emoji Configuration

### Simple Format (Global Mode)
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "frontend",
      "3001": "api",
      "3002": "database"
    }
  },
  "portMonitor.portEmojis": {
    "frontend": "🌐",
    "api": "🔧",
    "database": "🗃️"
  },
  "portMonitor.emojiMode": "replace"
}
```

**Display:** `🌐frontend:3000 🔧api:3001 🗃️database:3002`

### Individual Port Configuration
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "car",
      "3001": "user",
      "3002": "ai-cam",
      "3003": "proxy",
      "3004": "monitor"
    }
  },
  "portMonitor.portEmojis": {
    "car": "🚗",                    // Uses global emojiMode (replace)
    "user": { "prefix": "🙂" },     // Individual prefix mode
    "ai-cam": { "replace": "🤖" },  // Individual replace mode
    "proxy": { "suffix": "🍡" },    // Individual suffix mode
    "monitor": "📊"                 // Uses global emojiMode
  },
  "portMonitor.emojiMode": "replace"
}
```

**Display Examples:**
- In-use: `🚗car:3000 🙂🟢user:3001 🤖ai-cam:3002 🟢proxy🍡:3003 📊monitor:3004`
- Free: `⚪️car:3000 🙂⚪️user:3001 ⚪️ai-cam:3002 ⚪️proxy🍡:3003 ⚪️monitor:3004`

### Emoji Mode Comparison
```json
{
  "portMonitor.portEmojis": {
    "app": "🚀"
  }
}
```

| Mode | In-Use Display | Free Display |
|------|---------------|--------------|
| `replace` | `🚀app:3000` | `⚪️app:3000` |
| `prefix` | `🚀🟢app:3000` | `🚀⚪️app:3000` |
| `suffix` | `🟢app🚀:3000` | `⚪️app🚀:3000` |

## Display Customization

### Status Icons
```json
{
  "portMonitor.statusIcons": {
    "inUse": "✅",
    "free": "❌"
  }
}
```

### Compact Display
```json
{
  "portMonitor.hosts": {
    "Frontend": {
      "3000": "react",
      "3001": "vue",
      "3002": "angular",
      "__CONFIG": {
        "compact": true,
        "separator": " | "
      }
    }
  }
}
```

**Display:** `300[✅react:0 | ❌vue:1 | ✅angular:2]`

### Background Colors
```json
{
  "portMonitor.backgroundColor": "statusBarItem.warningBackground",
  "portMonitor.portColors": {
    "3000": "#ff6b6b",
    "3001": "#4ecdc4",
    "8080": "statusBarItem.errorBackground"
  }
}
```

### Status Bar Position
```json
{
  "portMonitor.statusBarPosition": "left"
}
```

## Multi-Host Setup

```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Development": {
        "3000": "react-app",
        "3001": "express-api",
        "5432": "postgres"
      },
      "Testing": ["8080", "9000"]
    },
    "production.example.com": {
      "Web Services": ["http", "https"],
      "Database": ["postgresql", "redis"]
    },
    "staging.example.com": {
      "Services": ["3000-3005"]
    }
  }
}
```

## Advanced Pattern Labels

```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3020", "8080-8090"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",
    "300*": "dev-env",
    "301*": "microservice",
    "8080": "webpack-dev",
    "808*": "proxy-*",
    "*": "unknown"
  }
}
```

**Pattern Priority (highest to lowest):**
1. Exact match: `"3000"`
2. Prefix match: `"300*"`
3. Suffix match: `"*80"`
4. Single char: `"30?0"`
5. Wildcard: `"*"`

## Complete Examples

### Development Environment
```json
{
  "portMonitor.hosts": {
    "Frontend": {
      "3000": "react",
      "6006": "storybook",
      "8080": "webpack",
      "__CONFIG": {
        "compact": true,
        "separator": " | ",
        "bgcolor": "statusBarItem.prominentBackground"
      }
    },
    "Backend": {
      "3001": "node-api",
      "3002": "python-api",
      "5432": "postgres",
      "6379": "redis"
    }
  },
  "portMonitor.portEmojis": {
    "react": "⚛️",
    "storybook": "📚",
    "webpack": "📦",
    "node-api": { "replace": "🟢" },
    "python-api": { "replace": "🐍" },
    "postgres": "🐘",
    "redis": "🔴"
  },
  "portMonitor.emojiMode": "replace",
  "portMonitor.statusIcons": {
    "inUse": "🟢",
    "free": "⚪️"
  },
  "portMonitor.intervalMs": 2000,
  "portMonitor.statusBarPosition": "right"
}
```

### Microservices Architecture
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Gateway": {
        "8080": "api-gateway",
        "__CONFIG": { "bgcolor": "statusBarItem.errorBackground" }
      },
      "Services": {
        "3000": "user-service",
        "3001": "auth-service",
        "3002": "order-service",
        "3003": "payment-service"
      },
      "Databases": ["5432", "27017", "6379"]
    }
  },
  "portMonitor.portLabels": {
    "5432": "postgres",
    "27017": "mongodb",
    "6379": "redis"
  },
  "portMonitor.portEmojis": {
    "api-gateway": { "prefix": "🚪" },
    "user-service": { "prefix": "👤" },
    "auth-service": { "prefix": "🔐" },
    "order-service": { "prefix": "📦" },
    "payment-service": { "prefix": "💳" },
    "postgres": "🐘",
    "mongodb": "🍃",
    "redis": "🔴"
  },
  "portMonitor.displayOptions": {
    "separator": " • ",
    "showFullPortNumber": true
  }
}
```

### Production Monitoring
```json
{
  "portMonitor.hosts": {
    "prod-web-01.example.com": {
      "Web": ["http", "https"]
    },
    "prod-api-01.example.com": {
      "API": ["3000", "3001"]
    },
    "prod-db-01.example.com": {
      "Database": ["postgresql", "redis"]
    }
  },
  "portMonitor.statusIcons": {
    "inUse": "🟢",
    "free": "🔴"
  },
  "portMonitor.backgroundColor": "statusBarItem.warningBackground",
  "portMonitor.intervalMs": 5000
}
```

## Migration Examples

### From Simple Array to Labeled Configuration
**Before:**
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 3001, 3002]
  }
}
```

**After:**
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "frontend",
      "3001": "backend",
      "3002": "database"
    }
  },
  "portMonitor.portEmojis": {
    "frontend": "🌐",
    "backend": "🔧",
    "database": "🗃️"
  }
}
```

### Adding Emoji Configuration
**Step 1 - Basic emojis:**
```json
{
  "portMonitor.portEmojis": {
    "frontend": "🌐",
    "backend": "🔧"
  }
}
```

**Step 2 - Individual modes:**
```json
{
  "portMonitor.portEmojis": {
    "frontend": { "replace": "🌐" },
    "backend": { "prefix": "🔧" }
  }
}
```

## Troubleshooting

### Common Issues

1. **Emoji not displaying:** Ensure the port label matches exactly
2. **Wrong emoji mode:** Check individual configuration overrides global setting
3. **Missing ports:** Verify host configuration and port ranges

### Debug Configuration
```json
{
  "portMonitor.hosts": {
    "Debug": {
      "3000": "test-app",
      "__CONFIG": {
        "compact": false,
        "separator": " | ",
        "show_title": true
      }
    }
  },
  "portMonitor.portEmojis": {
    "test-app": { "prefix": "🔍" }
  },
  "portMonitor.intervalMs": 1000
}
```