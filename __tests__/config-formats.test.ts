import { ConfigManager } from '../src/config';

describe('Port Monitor Configuration Formats', () => {
    
    // Test 1: Simple port configurations
    describe('Simple Port Configurations', () => {
        
        it('should handle direct port-label mapping', () => {
            const config = {
                "3000": "user",
                "3001": "car",
                "3007": "ai-cam"
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "__NOTITLE": {
                    "3000": "user",
                    "3001": "car", 
                    "3007": "ai-cam"
                }
            });
        });

        it('should handle port arrays', () => {
            const config = {
                "Development": [3000, 3001, 3007]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "__NOTITLE": {
                    "Development": {
                        3000: "",
                        3001: "",
                        3007: ""
                    }
                }
            });
        });

        it('should handle string port arrays', () => {
            const config = {
                "Development": ["3000", "3001", "3007"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "__NOTITLE": {
                    "Development": {
                        3000: "",
                        3001: "",
                        3007: ""
                    }
                }
            });
        });

        it('should handle port ranges', () => {
            const config = {
                "Development": ["3000-3002", "3007"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "__NOTITLE": {
                    "Development": {
                        3000: "",
                        3001: "",
                        3002: "",
                        3007: ""
                    }
                }
            });
        });

        it('should handle well-known port names', () => {
            const config = {
                "Web": ["http", "https", "ssh"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "__NOTITLE": {
                    "Web": {
                        "80": "http",
                        "443": "https",
                        "22": "ssh"
                    }
                }
            });
        });
    });

    // Test 2: Grouped configurations with __CONFIG
    describe('Grouped Configurations with __CONFIG', () => {
        
        it('should handle group with __CONFIG', () => {
            const config = {
                "Development": {
                    "3000": "user",
                    "3001": "car",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#ffcccc",
                        "separator": "|",
                        "show_title": false
                    }
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "Development": {
                    "3000": "user",
                    "3001": "car",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#ffcccc",
                        "separator": "|",
                        "show_title": false
                    }
                }
            });
        });

        it('should handle multiple groups with different configs', () => {
            const config = {
                "Development": {
                    "3000": "user",
                    "3001": "car",
                    "__CONFIG": {
                        "compact": true,
                        "show_title": false
                    }
                },
                "Database": {
                    "5432": "postgres",
                    "6379": "redis"
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "Development": {
                    "3000": "user",
                    "3001": "car",
                    "__CONFIG": {
                        "compact": true,
                        "show_title": false
                    }
                },
                "Database": {
                    "5432": "postgres",
                    "6379": "redis"
                }
            });
        });

        it('should handle partial __CONFIG settings', () => {
            const config = {
                "Development": {
                    "3000": "app",
                    "__CONFIG": {
                        "compact": true
                    }
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed.Development.__CONFIG).toEqual({
                "compact": true
            });
        });
    });

    // Test 3: Backward compatibility
    describe('Backward Compatibility', () => {
        
        it('should handle old localhost hierarchy format', () => {
            const config = {
                "localhost": {
                    "Development": {
                        "3000": "user",
                        "3001": "car"
                    }
                }
            };
            
            // Should be processed without localhost wrapper
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "localhost": {
                    "Development": {
                        "3000": "user",
                        "3001": "car"
                    }
                }
            });
        });

        it('should handle mixed formats', () => {
            const config = {
                "Development": [3000, 3001],
                "Database": {
                    "5432": "postgres"
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "__NOTITLE": {
                    "Development": {
                        3000: "",
                        3001: ""
                    },
                    "Database": {
                        "5432": "postgres"
                    }
                }
            });
        });

        it('should handle empty host name conversion', () => {
            const config = {
                "": {
                    "3000": "app"
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({
                "localhost": {
                    "3000": "app"
                }
            });
        });
    });

    // Test 4: parseHostsConfig functionality
    describe('parseHostsConfig Functionality', () => {
        
        it('should convert flat config to PortInfo array', () => {
            const mockConfig = {
                hosts: {
                    "Development": {
                        "3000": "user",
                        "3001": "car",
                        "__CONFIG": {
                            "compact": true,
                            "bgcolor": "#ffcccc"
                        }
                    }
                },
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
                    compact: true,
                    bgcolor: "#ffcccc",
                    separator: "|",
                    show_title: true
                }
            });
        });

        it('should apply default groupConfigs when __CONFIG is missing', () => {
            const mockConfig = {
                hosts: {
                    "Database": {
                        "5432": "postgres"
                    }
                },
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result[0].groupConfigs).toEqual({
                compact: false,
                separator: "|",
                show_title: true
            });
        });

        it('should handle simple port mapping', () => {
            const mockConfig = {
                hosts: {
                    "__NOTITLE": {
                        "3000": "app",
                        "3001": "api"
                    }
                },
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result).toHaveLength(2);
            expect(result[0].group).toBe("__NOTITLE");
            expect(result[0].host).toBe("localhost");
        });
    });

    // Test 5: Edge cases and error handling
    describe('Edge Cases and Error Handling', () => {
        
        it('should handle empty configuration', () => {
            const config = {};
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed).toEqual({});
        });

        it('should handle invalid port numbers', () => {
            const config = {
                "Development": {
                    "0": "invalid",
                    "65536": "invalid",
                    "3000": "valid"
                }
            };
            
            const mockConfig = {
                hosts: ConfigManager.processHostsConfig(config),
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            expect(result).toHaveLength(1);
            expect(result[0].port).toBe(3000);
        });

        it('should handle non-numeric port strings', () => {
            const config = {
                "Development": {
                    "abc": "invalid",
                    "3000": "valid"
                }
            };
            
            const mockConfig = {
                hosts: ConfigManager.processHostsConfig(config),
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            expect(result).toHaveLength(1);
            expect(result[0].port).toBe(3000);
        });

        it('should filter out __CONFIG from port processing', () => {
            const config = {
                "Development": {
                    "3000": "app",
                    "__CONFIG": {
                        "compact": true
                    },
                    "__SOME_OTHER_SETTING": "ignored"
                }
            };
            
            const mockConfig = {
                hosts: ConfigManager.processHostsConfig(config),
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            expect(result).toHaveLength(1);
            expect(result[0].port).toBe(3000);
        });

        it('should handle complex port ranges', () => {
            const config = {
                "Development": ["3000-3002", "8080-8081"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            expect(result).toHaveLength(5); // 3000,3001,3002,8080,8081
            
            const ports = result.map(r => r.port).sort((a, b) => a - b);
            expect(ports).toEqual([3000, 3001, 3002, 8080, 8081]);
        });

        it('should handle nested group structures', () => {
            const config = {
                "Project A": {
                    "Frontend": {
                        "3000": "react",
                        "__CONFIG": {"compact": true}
                    },
                    "Backend": {
                        "8000": "api"
                    }
                }
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            expect(processed["Project A"]).toBeDefined();
            expect(processed["Project A"]["Frontend"]).toBeDefined();
            expect(processed["Project A"]["Backend"]).toBeDefined();
        });
    });

    // Test 6: Integration tests
    describe('Integration Tests', () => {
        
        it('should handle complete real-world configuration', () => {
            const config = {
                "Development": {
                    "3000": "react-app",
                    "3001": "vue-app",
                    "3007": "test-server",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#e6f3ff",
                        "separator": "|",
                        "show_title": false
                    }
                },
                "Backend": {
                    "8000": "django",
                    "8001": "fastapi",
                    "__CONFIG": {
                        "compact": false,
                        "show_title": true
                    }
                },
                "Database": {
                    "5432": "postgres",
                    "6379": "redis",
                    "27017": "mongodb"
                },
                "Services": ["http", "https", "ssh"]
            };
            
            const processed = ConfigManager.processHostsConfig(config);
            const mockConfig = {
                hosts: processed,
                portLabels: {
                    "3000": "Frontend",
                    "8000": "Main API"
                },
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            // Should have all ports from all groups
            expect(result.length).toBeGreaterThan(10);
            
            // Check specific configurations
            const devPorts = result.filter(r => r.group === "Development");
            expect(devPorts[0].groupConfigs?.compact).toBe(true);
            expect(devPorts[0].groupConfigs?.show_title).toBe(false);
            
            const backendPorts = result.filter(r => r.group === "Backend");
            expect(backendPorts[0].groupConfigs?.compact).toBe(false);
            expect(backendPorts[0].groupConfigs?.show_title).toBe(true);
            
            const dbPorts = result.filter(r => r.group === "Database");
            expect(dbPorts[0].groupConfigs?.compact).toBe(false); // default
            
            // Check well-known ports - Services is now under __NOTITLE
            const servicePorts = result.filter(r => r.group === "__NOTITLE");
            const httpPort = servicePorts.find(r => r.port === 80);
            expect(httpPort?.label).toBe("http");
        });
    });
});