import { ConfigManager } from '../src/config';

describe('ConfigManager Step-by-Step Processing', () => {
    describe('Step 1: Replace Well-Known Ports', () => {
        test('should replace well-known port names in arrays', () => {
            const input = {
                "Web": ["http", "https", "ssh"]
            };
            const result = (ConfigManager as any).step1_ReplaceWellKnownPorts(input);
            expect(result).toEqual({
                "Web": [
                    { "__port": 80, "__originalName": "http" },
                    { "__port": 443, "__originalName": "https" },
                    { "__port": 22, "__originalName": "ssh" }
                ]
            });
        });

        test('should replace well-known port names in keys', () => {
            const input = {
                "Services": {
                    "http": "web",
                    "https": "secure",
                    "postgresql": "database"
                }
            };
            const result = (ConfigManager as any).step1_ReplaceWellKnownPorts(input);
            expect(result).toEqual({
                "Services": {
                    "80": "web",
                    "443": "secure",
                    "5432": "database"
                }
            });
        });

        test('should handle mixed well-known and numeric ports', () => {
            const input = {
                "Mixed": ["http", 3000, "postgresql", "3001-3003"]
            };
            const result = (ConfigManager as any).step1_ReplaceWellKnownPorts(input);
            expect(result).toEqual({
                "Mixed": [
                    { "__port": 80, "__originalName": "http" },
                    3000,
                    { "__port": 5432, "__originalName": "postgresql" },
                    "3001-3003"
                ]
            });
        });

        test('should handle nested structures', () => {
            const input = {
                "localhost": {
                    "Web": ["http", "https"],
                    "Database": ["postgresql", "redis"]
                }
            };
            const result = (ConfigManager as any).step1_ReplaceWellKnownPorts(input);
            expect(result).toEqual({
                "localhost": {
                    "Web": [
                        { "__port": 80, "__originalName": "http" },
                        { "__port": 443, "__originalName": "https" }
                    ],
                    "Database": [
                        { "__port": 5432, "__originalName": "postgresql" },
                        { "__port": 6379, "__originalName": "redis" }
                    ]
                }
            });
        });
    });

    describe('Step 2: Expand Port Ranges', () => {
        test('should expand port ranges in arrays', () => {
            const input = {
                "Development": [3000, "3001-3003", 8080]
            };
            const result = (ConfigManager as any).step2_ExpandPortRanges(input);
            expect(result).toEqual({
                "Development": [3000, 3001, 3002, 3003, 8080]
            });
        });

        test('should expand port ranges in keys', () => {
            const input = {
                "Services": {
                    "3000-3002": "dev",
                    "8080": "proxy"
                }
            };
            const result = (ConfigManager as any).step2_ExpandPortRanges(input);
            expect(result).toEqual({
                "Services": {
                    "3000": "dev",
                    "3001": "dev",
                    "3002": "dev",
                    "8080": "proxy"
                }
            });
        });

        test('should handle multiple ranges', () => {
            const input = {
                "Multiple": ["3000-3002", "8080-8081"]
            };
            const result = (ConfigManager as any).step2_ExpandPortRanges(input);
            expect(result).toEqual({
                "Multiple": [3000, 3001, 3002, 8080, 8081]
            });
        });

        test('should handle nested structures with ranges', () => {
            const input = {
                "localhost": {
                    "Development": ["3000-3002"],
                    "Testing": {
                        "4000-4001": "test"
                    }
                }
            };
            const result = (ConfigManager as any).step2_ExpandPortRanges(input);
            expect(result).toEqual({
                "localhost": {
                    "Development": [3000, 3001, 3002],
                    "Testing": {
                        "4000": "test",
                        "4001": "test"
                    }
                }
            });
        });
    });

    describe('Step 3: Add Default Group Wrapper', () => {
        test('should wrap direct port mappings in __NOTITLE', () => {
            const input = {
                "3000": "app",
                "3001": "api"
            };
            const result = (ConfigManager as any).step3_AddDefaultGroupWrapper(input);
            expect(result).toEqual({
                "__NOTITLE": {
                    "3000": "app",
                    "3001": "api"
                }
            });
        });

        test('should wrap arrays in __NOTITLE', () => {
            const input = {
                "Development": [3000, 3001]
            };
            const result = (ConfigManager as any).step3_AddDefaultGroupWrapper(input);
            expect(result).toEqual({
                "__NOTITLE": {
                    "Development": [3000, 3001]
                }
            });
        });

        test('should convert empty host name to localhost', () => {
            const input = {
                "": {
                    "3000": "app"
                }
            };
            const result = (ConfigManager as any).step3_AddDefaultGroupWrapper(input);
            expect(result).toEqual({
                "localhost": {
                    "3000": "app"
                }
            });
        });

        test('should not wrap already grouped configurations', () => {
            const input = {
                "Development": {
                    "3000": "app",
                    "3001": "api"
                }
            };
            const result = (ConfigManager as any).step3_AddDefaultGroupWrapper(input);
            expect(result).toEqual({
                "Development": {
                    "3000": "app",
                    "3001": "api"
                }
            });
        });
    });

    describe('Step 4: Convert Arrays to Objects', () => {
        test('should convert arrays to port-label objects', () => {
            const input = {
                "Development": [3000, 3001, 3002]
            };
            const result = (ConfigManager as any).step4_ConvertArraysToObjects(input);
            expect(result).toEqual({
                "Development": {
                    "3000": "",
                    "3001": "",
                    "3002": ""
                }
            });
        });

        test('should handle string port numbers in arrays', () => {
            const input = {
                "Development": ["3000", "3001", 3002]
            };
            const result = (ConfigManager as any).step4_ConvertArraysToObjects(input);
            expect(result).toEqual({
                "Development": {
                    "3000": "",
                    "3001": "",
                    "3002": ""
                }
            });
        });

        test('should preserve existing object structures', () => {
            const input = {
                "Development": {
                    "3000": "app",
                    "3001": "api"
                }
            };
            const result = (ConfigManager as any).step4_ConvertArraysToObjects(input);
            expect(result).toEqual({
                "Development": {
                    "3000": "app",
                    "3001": "api"
                }
            });
        });

        test('should handle nested structures with mixed arrays and objects', () => {
            const input = {
                "localhost": {
                    "Development": [3000, 3001],
                    "Database": {
                        "5432": "postgres"
                    }
                }
            };
            const result = (ConfigManager as any).step4_ConvertArraysToObjects(input);
            expect(result).toEqual({
                "localhost": {
                    "Development": {
                        "3000": "",
                        "3001": ""
                    },
                    "Database": {
                        "5432": "postgres"
                    }
                }
            });
        });
    });

    describe('Step 5: Normalize Structure', () => {
        test('should normalize nested structures', () => {
            const input = {
                "Development": {
                    "3000": "app",
                    "3001": "api",
                    "__CONFIG": {
                        "compact": true
                    }
                }
            };
            const result = (ConfigManager as any).step5_NormalizeStructure(input);
            expect(result).toEqual({
                "Development": {
                    "3000": "app",
                    "3001": "api",
                    "__CONFIG": {
                        "compact": true
                    }
                }
            });
        });

        test('should handle deeply nested structures', () => {
            const input = {
                "localhost": {
                    "Development": {
                        "3000": "app",
                        "3001": "api"
                    }
                }
            };
            const result = (ConfigManager as any).step5_NormalizeStructure(input);
            expect(result).toEqual({
                "localhost": {
                    "Development": {
                        "3000": "app",
                        "3001": "api"
                    }
                }
            });
        });
    });

    describe('Full 5-Step Processing Integration', () => {
        test('should process complete configuration with all steps', () => {
            const input = {
                "Web": ["http", "https", "3000-3002"],
                "Database": ["postgresql", "redis"]
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({
                "__NOTITLE": {
                    "Web": {
                        "80": "http",
                        "443": "https",
                        "3000": "",
                        "3001": "",
                        "3002": ""
                    },
                    "Database": {
                        "5432": "postgresql",
                        "6379": "redis"
                    }
                }
            });
        });

        test('should handle complex nested configuration', () => {
            const input = {
                "localhost": {
                    "Development": ["3000-3002", "http"],
                    "Database": ["postgresql"]
                }
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({
                "localhost": {
                    "Development": {
                        "3000": "",
                        "3001": "",
                        "3002": "",
                        "80": "http"
                    },
                    "Database": {
                        "5432": "postgresql"
                    }
                }
            });
        });

        test('should handle direct port mapping with well-known ports', () => {
            const input = {
                "http": "web",
                "https": "secure",
                "3000": "app"
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({
                "__NOTITLE": {
                    "80": "web",
                    "443": "secure",
                    "3000": "app"
                }
            });
        });

        test('should handle configuration with __CONFIG', () => {
            const input = {
                "Development": {
                    "3000": "app",
                    "3001": "api",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#ffcccc"
                    }
                }
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({
                "Development": {
                    "3000": "app",
                    "3001": "api",
                    "__CONFIG": {
                        "compact": true,
                        "bgcolor": "#ffcccc"
                    }
                }
            });
        });

        test('should handle empty configuration', () => {
            const input = {};
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({});
        });
    });
});