# Port Monitor - Use Case Examples

Specific configuration examples tailored to real development scenarios.

**Note**: All examples showcase the v0.3.5 intelligent configuration processing with smart error detection, 4-step transformation that automatically handles well-known port names, port ranges, and multiple configuration formats with zero external dependencies.

## 🎯 Practical Use Cases

### Case 1: Startup Full-Stack Development
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Frontend": {
        "3000": "Customer App",
        "3001": "Admin Panel", 
        "3002": "Landing Page"
      },
      "Microservices": {
        "8001-8004": "APIs"
      },
      "Infrastructure": ["postgresql", "redis", 9200],
      "Dev Tools": [6006, 4000, 8080]
    }
  },
  "portMonitor.portLabels": {
    "8001": "Auth API",
    "8002": "User API",
    "8003": "Payment API",
    "8004": "Notification API",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "9200": "Elasticsearch",
    "6006": "Storybook",
    "4000": "GraphQL Playground",
    "8080": "API Gateway"
  },
  "portMonitor.displayOptions": {
    "separator": " | ",
    "compactRanges": true,
    "maxDisplayLength": 180
  },
  "portMonitor.statusBarPosition": "right"
}
```

### Case 2: Enterprise Multi-Project Environment
```json
{
  "portMonitor.hosts": {
    "Project A": {
      "localhost": [3000, 3001, 5000, 5001]
    },
    "Project B": {
      "localhost": [3010, 3011, 5010, 5011]
    },
    "Project C": {
      "localhost": [3020, 3021, 5020, 5021]
    },
    "Shared Infrastructure": {
      "localhost": [5432, 3306, 6379, 27017]
    },
    "Dev Support": {
      "localhost": [6006, 6016, 6026, 8080]
    }
  },
  "portMonitor.portLabels": {
    "3000": "A: Customer UI",
    "3001": "A: Admin Panel",
    "5000": "A: API",
    "5001": "A: Worker",
    "3010": "B: Customer UI",
    "3011": "B: Admin Panel",
    "5010": "B: API",
    "5011": "B: Worker",
    "3020": "C: Customer UI",
    "3021": "C: Admin Panel",
    "5020": "C: API",
    "5021": "C: Worker",
    "5432": "PostgreSQL",
    "3306": "MySQL",
    "6379": "Redis",
    "27017": "MongoDB",
    "6006": "A: Storybook",
    "6016": "B: Storybook",
    "6026": "C: Storybook",
    "8080": "Shared Gateway"
  }
}
```

### Case 3: E-Commerce Development Team
```json
{
  "portMonitor.hosts": {
    "Frontend": {
      "localhost": [3000, 3001, 3002, 3003]
    },
    "Backend APIs": {
      "localhost": [8000, 8001, 8002, 8003, 8004]
    },
    "Payment & External": {
      "localhost": [9000, 9001, 9002]
    },
    "Databases": {
      "localhost": [5432, 3306, 6379, 27017]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Shop UI",
    "3001": "Admin Panel",
    "3002": "Mobile App",
    "3003": "POS System",
    "8000": "Product API",
    "8001": "User API",
    "8002": "Order API",
    "8003": "Inventory API",
    "8004": "Recommendation API",
    "9000": "Payment Gateway",
    "9001": "External API Proxy",
    "9002": "Webhook Handler",
    "5432": "Product DB",
    "3306": "User DB",
    "6379": "Session Store",
    "27017": "Logs & Analytics"
  }
}
```

### Case 4: SaaS Development (Multi-tenant)
```json
{
  "portMonitor.hosts": {
    "Tenant A": {
      "localhost": [3000, 5000]
    },
    "Tenant B": {
      "localhost": [3001, 5001]
    },
    "Tenant C": {
      "localhost": [3002, 5002]
    },
    "Admin & Shared": {
      "localhost": [3100, 5100, 8080]
    },
    "Infrastructure": {
      "localhost": [5432, 6379, 9200, 5601]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Tenant A UI",
    "5000": "Tenant A API",
    "3001": "Tenant B UI",
    "5001": "Tenant B API",
    "3002": "Tenant C UI",
    "5002": "Tenant C API",
    "3100": "Admin Panel",
    "5100": "Admin API",
    "8080": "Proxy",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "9200": "Elasticsearch",
    "5601": "Kibana"
  },
  "portMonitor.displayOptions": {
    "separator": " • ",
    "compactRanges": false,
    "showFullPortNumber": true,
    "maxDisplayLength": 200
  }
}
```

### Case 5: Mobile App Development (React Native + Backend)
```json
{
  "portMonitor.hosts": {
    "React Native": {
      "localhost": [8081, 19000, 19001, 19002]
    },
    "API Development": {
      "localhost": [3000, 3001, 3002]
    },
    "Mock Servers": {
      "localhost": [4000, 4001, 4002]
    },
    "Databases": {
      "localhost": [5432, 6379]
    },
    "Dev Tools": {
      "localhost": [9090, 3030, 8080]
    }
  },
  "portMonitor.portLabels": {
    "8081": "Metro Bundler",
    "19000": "Expo DevTools",
    "19001": "iOS Simulator",
    "19002": "Android Emulator",
    "3000": "Auth API",
    "3001": "Data API",
    "3002": "Notification API",
    "4000": "Auth Mock",
    "4001": "Data Mock",
    "4002": "Notification Mock",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "9090": "Flipper",
    "3030": "Storybook",
    "8080": "API Gateway"
  }
}
```

### Case 6: AI/ML Development Environment
```json
{
  "portMonitor.hosts": {
    "Jupyter Environment": {
      "localhost": [8888, 8889, 8890, 8891]
    },
    "ML APIs": {
      "localhost": [5000, 5001, 5002, 5003]
    },
    "Frontend": {
      "localhost": [3000, 3001]
    },
    "Data Platform": {
      "localhost": [5432, 27017, 9200, 6379]
    },
    "Monitoring & Visualization": {
      "localhost": [6006, 4040, 9090, 3333]
    }
  },
  "portMonitor.portLabels": {
    "8888": "Jupyter Lab",
    "8889": "Jupyter Notebook",
    "8890": "JupyterHub",
    "8891": "Jupyter (Experimental)",
    "5000": "Inference API",
    "5001": "Training API",
    "5002": "Preprocessing API",
    "5003": "Evaluation API",
    "3000": "ML Admin Panel",
    "3001": "Experiment Results",
    "5432": "PostgreSQL",
    "27017": "MongoDB",
    "9200": "Elasticsearch",
    "6379": "Redis",
    "6006": "TensorBoard",
    "4040": "Spark UI",
    "9090": "Prometheus",
    "3333": "MLflow"
  }
}
```

### Case 7: Game Development (Unity + Server)
```json
{
  "portMonitor.hosts": {
    "Game Servers": {
      "localhost": [7777, 7778, 7779, 7780]
    },
    "Web Management": {
      "localhost": [3000, 3001, 8080]
    },
    "Databases": {
      "localhost": [5432, 6379, 27017]
    },
    "Analytics & Monitoring": {
      "localhost": [9090, 3030, 8086]
    }
  },
  "portMonitor.portLabels": {
    "7777": "Main Game",
    "7778": "Matchmaking",
    "7779": "Lobby Server",
    "7780": "Chat Server",
    "3000": "Admin Panel",
    "3001": "Player Dashboard",
    "8080": "API Gateway",
    "5432": "Game DB",
    "6379": "Session Store",
    "27017": "Logs & Stats",
    "9090": "Monitoring",
    "3030": "Analytics Dashboard",
    "8086": "Metrics"
  }
}
```

### Case 8: DevOps・CI/CD Environment
```json
{
  "portMonitor.hosts": {
    "Applications": {
      "localhost": [3000, 3001, 3002]
    },
    "CI/CD": {
      "localhost": [8080, 8081, 9000]
    },
    "Monitoring & Logs": {
      "localhost": [9090, 3333, 9200, 5601]
    },
    "Databases": {
      "localhost": [5432, 6379]
    },
    "Containers": {
      "localhost": [2375, 2376, 8000]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Dev Environment",
    "3001": "Staging Environment",
    "3002": "Test Environment",
    "8080": "Jenkins",
    "8081": "GitLab CI",
    "9000": "SonarQube",
    "9090": "Prometheus",
    "3333": "Grafana",
    "9200": "Elasticsearch",
    "5601": "Kibana",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "2375": "Docker API",
    "2376": "Docker TLS",
    "8000": "Portainer"
  }
}
```

### Case 9: Education & Learning Environment
```json
{
  "portMonitor.hosts": {
    "Learning Project 1": {
      "localhost": [3000, 5000]
    },
    "Learning Project 2": {
      "localhost": [3001, 5001]
    },
    "Learning Project 3": {
      "localhost": [3002, 5002]
    },
    "Tutorials": {
      "localhost": [8080, 8081, 8082]
    },
    "Shared Tools": {
      "localhost": [5432, 6379, 6006]
    }
  },
  "portMonitor.portLabels": {
    "3000": "React Learning",
    "5000": "Express Learning",
    "3001": "Vue Learning",
    "5001": "FastAPI Learning",
    "3002": "Angular Learning",
    "5002": "Django Learning",
    "8080": "HTML/CSS Practice",
    "8081": "JavaScript Practice",
    "8082": "TypeScript Practice",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "6006": "Storybook"
  },
  "portMonitor.displayOptions": {
    "separator": " | ",
    "compactRanges": true,
    "showFullPortNumber": false,
    "maxDisplayLength": 120
  }
}
```

### Case 10: Freelance・Multiple Clients
```json
{
  "portMonitor.hosts": {
    "Client A": {
      "localhost": [3000, 3001, 5000]
    },
    "Client B": {
      "localhost": [3010, 3011, 5010]
    },
    "Client C": {
      "localhost": [3020, 3021, 5020]
    },
    "Personal Projects": {
      "localhost": [3100, 5100]
    },
    "Shared Tools": {
      "localhost": [5432, 6379, 6006]
    }
  },
  "portMonitor.portLabels": {
    "3000": "A: E-commerce",
    "3001": "A: Admin Panel",
    "5000": "A: API",
    "3010": "B: Corporate Site",
    "3011": "B: CMS",
    "5010": "B: API",
    "3020": "C: Blog",
    "3021": "C: Dashboard",
    "5020": "C: API",
    "3100": "Personal: Portfolio",
    "5100": "Personal: API",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "6006": "Storybook"
  },
  "portMonitor.displayOptions": {
    "separator": " • ",
    "compactRanges": false,
    "showFullPortNumber": true,
    "maxDisplayLength": 160
  }
}
```

## ⚠️ Common Configuration Mistakes & Solutions (v0.3.5)

### Mistake 1: Reversed Port-Label Configuration

❌ **Incorrect Configuration:**
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

**Error Message**: `Port numbers should be keys, not values. Current: {"frontend": 3000} Correct: {"3000": "frontend"}`

✅ **Correct Configuration:**
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

### Mistake 2: Empty Host Name

❌ **Incorrect Configuration:**
```json
{
  "portMonitor.hosts": {
    "": {
      "Development": {
        "3000": "app",
        "3001": "api"
      }
    }
  }
}
```

**Error Message**: `Empty host name detected. Use "localhost" instead of ""`

✅ **Correct Configuration:**
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Development": {
        "3000": "app",
        "3001": "api"
      }
    }
  }
}
```

### Mistake 3: Host Name as Port Number

❌ **Incorrect Configuration:**
```json
{
  "portMonitor.hosts": {
    "3000": {
      "app": "main"
    },
    "3001": {
      "api": "backend"
    }
  }
}
```

**Error Message**: `Host "3000": Host name looks like a port number. Use "localhost" or proper hostname`

✅ **Correct Configuration:**
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "app",
      "3001": "api"
    }
  }
}
```

### Mistake 4: Mixed Configuration Format

❌ **Incorrect Configuration:**
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "app",      // Port as key (correct)
      "api": 3001,        // Port as value (incorrect)
      "5432": "database"  // Port as key (correct)
    }
  }
}
```

**Error Message**: `Mixed configuration detected. Use consistent format: {"3000": "label", "3001": "label"}`

✅ **Correct Configuration:**
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "3000": "app",
      "3001": "api", 
      "5432": "database"
    }
  }
}
```

### How Error Detection Helps

1. **Real-time Validation**: Errors are detected as you edit settings
2. **Specific Messages**: Each error shows exactly what's wrong and how to fix it
3. **Status Bar Indicator**: "Configuration Error" appears when issues are found
4. **Tooltip Details**: Hover over status bar for detailed error information
5. **Example Solutions**: Each error message includes correct format examples

### Status Bar Positioning (New in v0.3.5)

All configurations now support status bar positioning:

```json
{
  "portMonitor.statusBarPosition": "left"  // or "right" (default)
}
```

This setting:
- Takes effect immediately without restart
- Applies to all monitoring configurations
- Allows better integration with other extensions
