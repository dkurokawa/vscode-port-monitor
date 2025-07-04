import { ConfigManager, PortMonitorConfig } from '../src/config';

describe('ConfigManager', () => {
  it('should validate processed config (valid)', () => {
    const config: PortMonitorConfig = {
      hosts: { 
        localhost: { 
          "App Group": { 
            3000: "app", 
            3001: "api" 
          } 
        } 
      },
      statusIcons: { inUse: 'X', free: 'O' },
      intervalMs: 3000,
    };
    const errors = ConfigManager.validateConfig(config);
    expect(errors).toEqual([]);
  });

  it('should validate processed config with multiple hosts', () => {
    const config: PortMonitorConfig = {
      hosts: { 
        localhost: { 
          "Development": { 
            3000: "main", 
            3001: "api",
            3002: "dev" 
          } 
        },
        "127.0.0.1": {
          "Services": {
            22: "ssh",
            5432: "postgresql"
          }
        }
      },
      portLabels: { '3000': 'main', '300*': 'dev' },
      statusIcons: { inUse: 'X', free: 'O' },
      intervalMs: 3000,
    };
    const errors = ConfigManager.validateConfig(config);
    expect(errors).toEqual([]);
  });

  it('should catch invalid interval', () => {
    const config: PortMonitorConfig = {
      hosts: { 
        localhost: { 
          "App": { 
            3000: "app" 
          } 
        } 
      },
      statusIcons: { inUse: 'X', free: 'O' },
      intervalMs: 500,
    };
    const errors = ConfigManager.validateConfig(config);
    expect(errors).toContain('intervalMs must be at least 1000ms');
  });

  it('should catch invalid raw configuration', () => {
    const rawConfig = {
      hosts: { 
        "InvalidGroup": ["invalid-port-name"]
      },
      intervalMs: 500
    };
    const errors = ConfigManager.validateRawConfig(rawConfig);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('intervalMs must be at least 1000ms');
  });

  it('should parse processed hosts config correctly', () => {
    const config: PortMonitorConfig = {
      hosts: {
        "Next.js": { 
          "3000": "app", 
          "3001": "api" 
        },
        "Services": {
          "22": "ssh",
          "80": "http"
        }
      },
      statusIcons: { inUse: 'X', free: 'O' },
      intervalMs: 3000,
    };
    
    const result = ConfigManager.parseHostsConfig(config);
    expect(result).toEqual([
      { host: 'localhost', port: 3000, label: 'app', group: 'Next.js', groupConfigs: { compact: false, separator: '|', show_title: true } },
      { host: 'localhost', port: 3001, label: 'api', group: 'Next.js', groupConfigs: { compact: false, separator: '|', show_title: true } },
      { host: 'localhost', port: 22, label: 'ssh', group: 'Services', groupConfigs: { compact: false, separator: '|', show_title: true } },
      { host: 'localhost', port: 80, label: 'http', group: 'Services', groupConfigs: { compact: false, separator: '|', show_title: true } }
    ]);
  });

  it('should process direct port mapping format', () => {
    const rawConfig = {
      "3000": "user",
      "3001": "car", 
      "3007": "ai-cam"
    };
    
    const processed = ConfigManager.processHostsConfig(rawConfig);
    expect(processed).toEqual({
      "__NOTITLE": {
        "3000": "user",
        "3001": "car",
        "3007": "ai-cam"
      }
    });
  });
});
