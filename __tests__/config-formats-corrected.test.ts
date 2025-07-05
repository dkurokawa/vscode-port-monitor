import { ConfigManager } from '../src/config';

describe('Port Monitor Configuration Formats - Corrected', () => {
    
    // Test actual implementation behavior
    describe('Actual Configuration Processing', () => {
        
        it('should handle direct port-label mapping (converts to __NOTITLE with ports wrapper)', () => {
            const config = {
                "3000": "user",
                "3001": "car",
                "3007": "ai-cam"
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            // Direct port mapping gets wrapped as __NOTITLE with direct port-label mapping
            expect(processed).toHaveProperty('__NOTITLE');
            expect(processed.__NOTITLE).toEqual({
                "3000": "user",
                "3001": "car", 
                "3007": "ai-cam"
            });
        });

        it('should handle grouped configuration with ports and __CONFIG', () => {
            const config = {
                "Development": {
                    "3000": "user",
                    "3001": "car",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#ffcccc"
                    }
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toHaveProperty('Development');
            expect(processed.Development).toEqual({
                "3000": "user",
                "3001": "car",
                "__CONFIG": {
                    "compact": true,
                    "bgcolor": "#ffcccc"
                }
            });
        });

        it('should handle array configurations (gets wrapped)', () => {
            const config = {
                "Development": [3000, 3001, 3007]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            // Array gets wrapped in __NOTITLE, then converted to direct port mapping
            expect(processed).toHaveProperty('__NOTITLE');
            expect(processed.__NOTITLE).toHaveProperty('Development');
            expect(processed.__NOTITLE.Development).toEqual({
                3000: "",
                3001: "",
                3007: ""
            });
        });

        it('should handle well-known port names', () => {
            const config = {
                "Web": ["http", "https", "ssh"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toHaveProperty('__NOTITLE');
            expect(processed.__NOTITLE).toHaveProperty('Web');
            
            // Well-known ports should be converted to numbers with labels
            const webPorts = processed.__NOTITLE.Web as any;
            expect(webPorts["80"]).toBe("http");
            expect(webPorts["443"]).toBe("https");
            expect(webPorts["22"]).toBe("ssh");
        });

        it('should handle port ranges', () => {
            const config = {
                "Development": ["3000-3002"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed.__NOTITLE.Development).toEqual({
                3000: "",
                3001: "",
                3002: ""
            });
        });
    });

    describe('parseHostsConfig Integration', () => {
        
        it('should convert processed config to PortInfo array with default groupConfigs', () => {
            const processedConfig = {
                "Development": {
                    "3000": "user",
                    "3001": "car"
                }
            };
            
            const mockConfig = {
                hosts: processedConfig,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                host: "localhost",
                port: 3000,
                label: "user",
                group: "Development",
                groupConfigs: {
                    compact: false,
                    separator: "|",
                    show_title: true
                }
            });
        });

        it('should apply __CONFIG settings to groupConfigs', () => {
            const processedConfig = {
                "Development": {
                    "3000": "user",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#ffcccc",
                        "show_title": false
                    }
                }
            };
            
            const mockConfig = {
                hosts: processedConfig,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result[0].groupConfigs).toEqual({
                compact: true,
                bgcolor: "#ffcccc",
                separator: "|",
                show_title: false
            });
        });

        it('should handle __NOTITLE groups correctly', () => {
            const processedConfig = {
                "__NOTITLE": {
                    "3000": "app",
                    "3001": "api"
                }
            };
            
            const mockConfig = {
                hosts: processedConfig,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result).toHaveLength(2);
            expect(result[0].group).toBe("__NOTITLE");
            expect(result[0].host).toBe("localhost");
        });
    });

    describe('Real World Configurations', () => {
        
        it('should handle complete development setup', () => {
            const config = {
                "Frontend": {
                    "3000": "react-app",
                    "3001": "vue-app", 
                    "__CONFIG": {
                        "compact": true,
                        "show_title": false
                    }
                },
                "Backend": {
                    "8000": "django",
                    "8001": "fastapi"
                },
                "Database": ["postgresql", "redis"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            
            // Frontend should be wrapped in __NOTITLE since Database contains arrays
            expect(processed.__NOTITLE.Frontend).toEqual({
                "3000": "react-app",
                "3001": "vue-app",
                "__CONFIG": {
                    "compact": true,
                    "show_title": false
                }
            });
            
            // Backend should keep its structure
            expect(processed.Backend).toEqual({
                "8000": "django",
                "8001": "fastapi"
            });
            
            // Database array should be converted to port-label mapping
            expect(processed.Database).toEqual({
                "5432": "postgresql",
                "6379": "redis"
            });
        });

        it('should handle startup configuration example', () => {
            const config = {
                "Microservices": ["8001-8003"],
                "Infrastructure": ["postgresql", "redis"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            // Check startup configuration parsing - arrays get wrapped in __NOTITLE
            const allPorts = result.filter(r => r.group === "__NOTITLE");
            
            expect(allPorts.length).toBeGreaterThanOrEqual(5); // 3 microservices + 2 infrastructure
            expect(allPorts.find(r => r.port === 5432)?.label).toBe("postgresql");
            expect(allPorts.find(r => r.port === 6379)?.label).toBe("redis");
        });

        it('should handle simple user configuration', () => {
            const config = {
                "3000": "my-app",
                "3001": "my-api", 
                "5432": "database"
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result).toHaveLength(3);
            expect(result.every(r => r.group === "__NOTITLE")).toBe(true);
            expect(result.every(r => r.host === "localhost")).toBe(true);
            
            const ports = result.map(r => ({ port: r.port, label: r.label }));
            expect(ports).toEqual(expect.arrayContaining([
                { port: 3000, label: "my-app" },
                { port: 3001, label: "my-api" },
                { port: 5432, label: "database" }
            ]));
        });
    });

    describe('Error Handling', () => {
        
        it('should filter out invalid ports', () => {
            const config = {
                "Development": {
                    "0": "invalid-low",
                    "65536": "invalid-high", 
                    "3000": "valid",
                    "abc": "invalid-string"
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            // Should only have the valid port
            expect(result).toHaveLength(1);
            expect(result[0].port).toBe(3000);
            expect(result[0].label).toBe("valid");
        });

        it('should handle empty configuration gracefully', () => {
            const config = {};
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({});
            
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            expect(result).toEqual([]);
        });

        it('should handle __CONFIG without ports', () => {
            const config = {
                "Development": {
                    "__CONFIG": {
                        "compact": true
                    }
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            expect(result).toEqual([]);
        });
    });
});