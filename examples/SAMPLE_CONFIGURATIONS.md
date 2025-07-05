# Port Monitor - Sample Configurations

Comprehensive examples of port monitoring configurations for different development environments. 

**Note**: All configurations use the v0.3.6 intelligent processing system with 5-step automatic transformation:
1. **Well-known ports**: `"http"` → `80`, `"https"` → `443`, `"postgresql"` → `5432`, etc.
2. **Port range expansion**: `"3000-3009"` → individual ports `3000, 3001, 3002...`
3. **Smart grouping**: Simple arrays get organized automatically
4. **Array to object conversion**: `[3000, 3001]` → `{"3000": "", "3001": ""}`
5. **Structure normalization**: All formats converted to consistent internal structure

## 📋 Port Usage Patterns by Development Environment

### Frontend Frameworks
- **Next.js**: 3000-3009 (dev server, multiple instances)
- **React (CRA)**: 3000, 3001-3005 (dev server, storybook, etc.)
- **Vue.js**: 8080, 8081-8085 (dev server, nuxt)
- **Angular**: 4200, 4201-4205 (ng serve, multiple apps)
- **Svelte/SvelteKit**: 5173, 3000, 5000-5005
- **Vite**: 5173, 5174-5180 (multiple projects)

### Backend Frameworks
- **Express.js**: 3000, 8000, 8080
- **Fastify**: 3000, 8000
- **Koa.js**: 3000, 8000
- **NestJS**: 3000, 3001-3005
- **Spring Boot**: 8080, 8081-8085
- **Django**: 8000, 8001-8005
- **Flask**: 5000, 5001-5005
- **Ruby on Rails**: 3000, 3001-3005
- **Laravel**: 8000, 8001-8005
- **ASP.NET**: 5000, 5001, 7000-7005

### Databases
- **PostgreSQL**: 5432
- **MySQL/MariaDB**: 3306
- **MongoDB**: 27017
- **Redis**: 6379
- **Elasticsearch**: 9200, 9300
- **InfluxDB**: 8086
- **CouchDB**: 5984
- **Cassandra**: 9042

### DevOps & Tools
- **Docker**: 2375, 2376
- **Kubernetes**: 6443, 8080, 10250
- **Webpack Dev Server**: 8080, 8081-8085
- **Storybook**: 6006, 6007-6010
- **Jest Preview**: 3336
- **GraphQL Playground**: 4000, 4001-4005
- **Swagger UI**: 8080, 8081

### Microservices Architecture
- **API Gateway**: 8080, 8000
- **Auth Service**: 3001, 8001
- **User Service**: 3002, 8002
- **Product Service**: 3003, 8003
- **Payment Service**: 3004, 8004
- **Notification Service**: 3005, 8005

### Full-Stack Development
- **MEAN Stack**: 3000 (Angular), 8000 (Express), 27017 (MongoDB)
- **MERN Stack**: 3000 (React), 5000 (Express), 27017 (MongoDB)
- **LAMP Stack**: 80/8080 (Apache), 3306 (MySQL)
- **JAMstack**: 3000 (Gatsby/Next), 8888 (Netlify)

## 🔧 Sample Configuration Files

**Configuration Features (v0.3.3):**
- **Zero dependencies**: Native Node.js implementation for better security and performance
- **Well-known port names**: Use `"http"`, `"https"`, `"ssh"`, `"postgresql"`, etc. automatically converted to port numbers
- **Port ranges**: `"3000-3009"` automatically expands to individual ports 3000, 3001, 3002... 3009
- **Multiple formats**: Simple arrays, grouped configurations, and mixed formats all supported
- **Intelligent processing**: 4-step automatic transformation handles any configuration format

### 1. Next.js Development (Multiple Instances)
```json
{
  "portMonitor.hosts": {
    "Next.js": {
      "3000": "Main App",
      "3001": "Admin Panel",
      "3002": "Storybook",
      "3003": "API Docs",
      "3004": "Feature Branches",
      "3005": "Feature Branches",
      "3006": "Feature Branches",
      "3007": "Feature Branches",
      "3008": "Feature Branches",
      "3009": "Feature Branches",
      "__CONFIG": {
        "separator": " | ",
        "compact": true,
        "show_title": true
      }
    }
  }
}
```

### 1b. Next.js Development (Simple Array Format)
```json
{
  "portMonitor.hosts": {
    "Next.js Development": ["3000-3009"]
  },
  "portMonitor.portLabels": {
    "3000": "Main App",
    "3001": "Admin Panel",
    "3002": "Storybook",
    "3003": "API Docs",
    "300*": "Feature Branches"
  }
}
```

### 2. Full-Stack MERN Development
```json
{
  "portMonitor.hosts": {
    "Frontend": {
      "3000": "React App",
      "3001": "Admin Dashboard",
      "6006": "Storybook",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#e6f3ff",
        "show_title": true
      }
    },
    "Backend": {
      "5000": "Express API",
      "5001": "Auth Service",
      "4000": "GraphQL",
      "__CONFIG": {
        "compact": false,
        "bgcolor": "#fff2e6"
      }
    },
    "Database": {
      "27017": "MongoDB",
      "6379": "Redis"
    }
  }
}
```

### 3. Microservices Architecture
```json
{
  "portMonitor.hosts": {
    "API Gateway": {
      "8080": "Main Gateway",
      "8000": "Admin Gateway",
      "__CONFIG": {
        "compact": false,
        "bgcolor": "#ffebe6",
        "show_title": true
      }
    },
    "Core Services": {
      "3001": "Auth Service",
      "3002": "User Service",
      "3003": "Product Service",
      "3004": "Payment Service",
      "3005": "Notification Service",
      "__CONFIG": {
        "compact": true,
        "separator": " • "
      }
    },
    "Databases": {
      "5432": "postgresql",
      "3306": "mysql",
      "27017": "mongodb",
      "6379": "redis"
    },
    "DevTools": {
      "6006": "Storybook",
      "4000": "GraphQL Playground",
      "9200": "Elasticsearch"
    }
  }
}
```

### 4. Multi-Framework Development
```json
{
  "portMonitor.hosts": {
    "React Projects": {
      "3000": "React (Main)",
      "3001": "React (Feature)",
      "3002": "React (Experimental)",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#61dafb"
      }
    },
    "Vue Projects": {
      "8080": "Vue (Main)",
      "8081": "Vue (Admin)",
      "8082": "Vue (Mobile)",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#4fc08d"
      }
    },
    "Angular Projects": {
      "4200": "Angular (Main)",
      "4201": "Angular (Admin)",
      "4202": "Angular (Components)",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#dd0031"
      }
    },
    "Backend APIs": {
      "5000": "Flask API",
      "8000": "Django API",
      "7000": "ASP.NET API"
    }
  }
}
```

### 5. Development + Production Monitoring
```json
{
  "portMonitor.hosts": {
    "Local Development": {
      "3000": "Next.js Dev",
      "3001": "Next.js Preview",
      "5000": "API Dev",
      "5432": "PostgreSQL",
      "6379": "Redis",
      "__CONFIG": {
        "separator": " • ",
        "compact": true,
        "bgcolor": "#e6ffe6"
      }
    },
    "Staging Environment": {
      "80": "HTTP",
      "443": "HTTPS",
      "5432": "Database",
      "__CONFIG": {
        "bgcolor": "#fff9e6",
        "show_title": true
      }
    },
    "Production Health Check": {
      "80": "API HTTP",
      "443": "API HTTPS",
      "5432": "DB Server",
      "__CONFIG": {
        "bgcolor": "#ffe6e6",
        "show_title": true
      }
    }
  }
}
```

### 6. Docker Compose Development
```json
{
  "portMonitor.hosts": {
    "Web Services": {
      "3000": "Frontend",
      "8080": "API Gateway",
      "8000": "Admin Panel",
      "__CONFIG": {
        "compact": false,
        "bgcolor": "#e6f7ff"
      }
    },
    "Databases": {
      "5432": "PostgreSQL",
      "3306": "MySQL",
      "27017": "MongoDB",
      "6379": "Redis",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#f0f8e6"
      }
    },
    "Message Queues": {
      "5672": "RabbitMQ",
      "15672": "RabbitMQ Management",
      "9092": "Kafka"
    },
    "Monitoring": {
      "9090": "Prometheus",
      "3001": "Grafana",
      "9200": "Elasticsearch",
      "5601": "Kibana",
      "__CONFIG": {
        "separator": " | ",
        "show_title": true
      }
    }
  }
}
```

### 7. Mobile Development (React Native + Expo)
```json
{
  "portMonitor.hosts": {
    "React Native": {
      "8081": "Metro Bundler",
      "19000": "Expo DevTools",
      "19001": "Expo iOS",
      "19002": "Expo Android",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#20232a"
      }
    },
    "Development Tools": {
      "8080": "Flipper",
      "8081": "Metro (Alt)"
    },
    "Backend APIs": {
      "3000": "API Server",
      "5000": "Mock Server"
    }
  }
}
```

### 8. WordPress Development
```json
{
  "portMonitor.hosts": {
    "WordPress Sites": {
      "8080": "Main Site",
      "8081": "Staging Site",
      "8082": "Dev Site",
      "8083": "Test Site",
      "__CONFIG": {
        "compact": true,
        "separator": " | ",
        "show_title": true
      }
    },
    "Database": {
      "3306": "MySQL"
    },
    "Development Tools": {
      "1025": "MailHog SMTP",
      "8025": "MailHog Web",
      "3000": "BrowserSync"
    }
  }
}
```

### 9. AI/ML Development
```json
{
  "portMonitor.hosts": {
    "Jupyter Environment": {
      "8888": "Jupyter Lab",
      "8889": "Jupyter Notebook",
      "8890": "JupyterHub",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#f37626"
      }
    },
    "ML APIs": {
      "5000": "Flask ML API",
      "5001": "FastAPI ML",
      "8000": "Django ML",
      "__CONFIG": {
        "compact": false,
        "separator": " • "
      }
    },
    "Monitoring": {
      "6006": "TensorBoard",
      "4040": "Spark UI",
      "8080": "MLflow"
    }
  }
}
```

### 10. Game Development (Unity/Unreal)
```json
{
  "portMonitor.hosts": {
    "Game Servers": {
      "7777": "Game Server",
      "7778": "Match Making",
      "7779": "Lobby Server",
      "__CONFIG": {
        "compact": true,
        "bgcolor": "#000000",
        "separator": " | "
      }
    },
    "Web Services": {
      "3000": "Admin Dashboard",
      "8080": "API Gateway"
    },
    "Analytics": {
      "9090": "Metrics",
      "3001": "Analytics Dashboard"
    }
  }
}
```

## 💡 Configuration Tips

### Display Optimization
- **compactRanges**: Display consecutive ports in shortened form (3000-3009 → 3000-9)
- **showFullPortNumber**: Display full port numbers (false recommended)
- **maxDisplayLength**: Character limit for status bar display
- **separator**: Customize delimiter between ports

### Label Patterns
- **Range Labels**: "3000-3009": "Next.js Apps"
- **Individual Labels**: "3000": "Main App", "3001": "Admin"
- **Process Names**: "5432": "PostgreSQL", "27017": "MongoDB"
- **Environment-based**: "3000": "Dev", "3001": "Staging"

### Host Organization
- **By Function**: Frontend, Backend, Database
- **By Service**: Auth, User, Payment
- **By Environment**: Development, Staging, Production
- **By Project**: ProjectA, ProjectB, ProjectC
