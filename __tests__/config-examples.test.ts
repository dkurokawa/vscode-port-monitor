import { ConfigManager } from '../src/config';

describe('Configuration Examples', () => {
    
    describe('Documentation Examples', () => {
        
        it('should handle beginner simple configuration', () => {
            const beginnerConfig = {
                "3000": "user",
                "3001": "car",
                "3007": "ai-cam"
            };
            
            const processed = ConfigManager.processHostsConfig(beginnerConfig);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            expect(result).toHaveLength(3);
            expect(result[0].group).toBe("__NOTITLE");
            expect(result[0].host).toBe("localhost");
            expect(result.map(r => r.port)).toEqual(expect.arrayContaining([3000, 3001, 3007]));
        });

        it('should handle advanced grouped configuration', () => {
            const advancedConfig = {
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
            };
            
            const processed = ConfigManager.processHostsConfig(advancedConfig);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            const devPorts = result.filter(r => r.group === "Development");
            const dbPorts = result.filter(r => r.group === "Database");
            
            expect(devPorts).toHaveLength(3);
            expect(dbPorts).toHaveLength(2);
            
            expect(devPorts[0].groupConfigs).toEqual({
                compact: true,
                bgcolor: "#ffcccc",
                separator: "|",
                show_title: false
            });
            
            expect(dbPorts[0].groupConfigs).toEqual({
                compact: false,
                separator: "|",
                show_title: true
            });
        });

        it('should handle startup full-stack configuration', () => {
            const startupConfig = {
                "Frontend": {
                    "3000": "Customer App",
                    "3001": "Admin Panel",
                    "3002": "Landing Page",
                    "__CONFIG": {
                        "compact": true,
                        "show_title": true
                    }
                },
                "Microservices": ["8001", "8002", "8003", "8004"],
                "Infrastructure": ["postgresql", "redis", "9200"],
                "Dev Tools": [6006, 4000, 8080]
            };
            
            const processed = ConfigManager.processHostsConfig(startupConfig);
            const mockConfig = {
                hosts: processed,
                portLabels: {
                    "8001": "Auth API",
                    "8002": "User API",
                    "5432": "PostgreSQL",
                    "6379": "Redis",
                    "9200": "Elasticsearch"
                },
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            // Check Frontend group
            const frontend = result.filter(r => r.group === "Frontend");
            expect(frontend).toHaveLength(3);
            expect(frontend[0].groupConfigs?.compact).toBe(true);
            
            // Check Microservices group
            const microservices = result.filter(r => r.group === "Microservices");
            expect(microservices).toHaveLength(4);
            expect(microservices.map(r => r.port)).toEqual([8001, 8002, 8003, 8004]);
            
            // Check Infrastructure with well-known ports
            const infrastructure = result.filter(r => r.group === "Infrastructure");
            const postgresPort = infrastructure.find(r => r.port === 5432);
            const redisPort = infrastructure.find(r => r.port === 6379);
            
            expect(postgresPort?.label).toBe("postgresql");
            expect(redisPort?.label).toBe("redis");
        });

        it('should handle e-commerce development configuration', () => {
            const ecommerceConfig = {
                "Frontend": [3000, 3001, 3002, 3003],
                "Backend APIs": {
                    "8000": "Product API",
                    "8001": "User API", 
                    "8002": "Order API",
                    "__CONFIG": {
                        "compact": false,
                        "separator": " • "
                    }
                },
                "Payment & External": ["9000-9002"],
                "Databases": ["postgresql", "mysql", "redis", "mongodb"]
            };
            
            const processed = ConfigManager.processHostsConfig(ecommerceConfig);
            const mockConfig = {
                hosts: processed,
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            // Verify all groups are processed
            const groups = [...new Set(result.map(r => r.group))];
            expect(groups).toEqual(expect.arrayContaining([
                "Frontend", "Backend APIs", "Payment & External", "Databases"
            ]));
            
            // Check port range expansion
            const paymentPorts = result.filter(r => r.group === "Payment & External");
            expect(paymentPorts).toHaveLength(3);
            expect(paymentPorts.map(r => r.port).sort()).toEqual([9000, 9001, 9002]);
            
            // Check Backend APIs config
            const backendPorts = result.filter(r => r.group === "Backend APIs");
            expect(backendPorts[0].groupConfigs?.separator).toBe(" • ");
        });

        it('should handle AI/ML development configuration', () => {
            const aiConfig = {
                "Jupyter Environment": ["8888-8891"],
                "ML APIs": {
                    "5000": "Inference API",
                    "5001": "Training API",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#e6f7ff"
                    }
                },
                "Frontend": ["3000", "3001"],
                "Data Platform": ["postgresql", "mongodb", "elasticsearch", "redis"],
                "Monitoring": [6006, 4040, 9090, 3333]
            };
            
            const processed = ConfigManager.processHostsConfig(aiConfig);
            const mockConfig = {
                hosts: processed,
                portLabels: {
                    "8888": "Jupyter Lab",
                    "6006": "TensorBoard",
                    "4040": "Spark UI"
                },
                statusIcons: { inUse: "🟢", free: "⚪️" },
                intervalMs: 3000
            } as any;
            
            const result = ConfigManager.parseHostsConfig(mockConfig);
            
            // Check Jupyter range
            const jupyter = result.filter(r => r.group === "Jupyter Environment");
            expect(jupyter).toHaveLength(4);
            expect(jupyter.map(r => r.port).sort()).toEqual([8888, 8889, 8890, 8891]);
            
            // Check ML APIs config
            const mlApis = result.filter(r => r.group === "ML APIs");
            expect(mlApis[0].groupConfigs?.compact).toBe(true);
            expect(mlApis[0].groupConfigs?.bgcolor).toBe("#e6f7ff");
            
            // Check well-known ports in Data Platform
            const dataPlatform = result.filter(r => r.group === "Data Platform");
            const postgresPort = dataPlatform.find(r => r.port === 5432);
            const mongoPort = dataPlatform.find(r => r.port === 27017);
            
            expect(postgresPort?.label).toBe("postgresql");
            expect(mongoPort?.label).toBe("mongodb");
        });
    });

    describe('Error Recovery Examples', () => {
        
        it('should handle and process previously invalid configurations', () => {
            // Test configuration that would have caused errors before
            const previouslyInvalidConfig = {
                "Development": {
                    "user": 3000,  // This was invalid before
                    "car": 3001    // This was invalid before
                }
            };
            
            // Should now be caught by validation
            const errors = ConfigManager.validateHostsStructure(previouslyInvalidConfig);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('Port numbers should be keys, not values');
        });

        it('should provide correct format suggestion', () => {
            const invalidConfig = {
                "Development": {
                    "frontend": 3000,
                    "backend": 3001
                }
            };
            
            const errors = ConfigManager.validateHostsStructure(invalidConfig);
            expect(errors[0]).toContain('Current: {\"frontend\": 3000}');
        });
    });

    describe('Migration Examples', () => {
        
        it('should handle migration from old to new format', () => {
            // Old format with localhost wrapper
            const oldFormat = {
                "localhost": {
                    "Development": {
                        "3000": "app",
                        "3001": "api"
                    }
                }
            };
            
            // Should still work but maintain structure
            const processed = ConfigManager.processHostsConfig(oldFormat);
            expect(processed.localhost).toBeDefined();
            expect(processed.localhost.Development).toBeDefined();
        });

        it('should handle simple port list migration', () => {
            // Very simple format
            const simpleFormat = ["3000", "3001", "3007"];
            
            const processed = ConfigManager.processHostsConfig(simpleFormat);
            expect(processed).toEqual({
                3000: "",
                3001: "", 
                3007: ""
            });
        });
    });
});