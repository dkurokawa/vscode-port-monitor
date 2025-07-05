import { ConfigManager } from '../src/config';

describe('ConfigManager.processHostsConfig', () => {
    describe('Step 1: Replace well-known ports', () => {
        it('should replace well-known port names with numbers in arrays', () => {
            const input = {
                "Web": ["http", "https"]
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({
                "__NOTITLE": {
                    "Web": {
                        "80": "http",
                        "443": "https"
                    }
                }
            });
        });

        it('should handle mixed arrays with numbers and well-known ports', () => {
            const input = {
                "Services": [22, 5432, 8080]  // After well-known port replacement
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toEqual({
                "__NOTITLE": {
                    "Services": {
                        22: "",
                        5432: "",
                        8080: ""
                    }
                }
            });
        });
    });

    describe('Step 2: Add default group wrapper', () => {
        it('should wrap simple array config with __NOTITLE group', () => {
            const input = {
                "Next.js": [3000, 3001, "3002-3009"]
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).toHaveProperty('__NOTITLE');
            expect(result.__NOTITLE['Next.js']).toBeDefined();
            expect(result.__NOTITLE['Next.js']).toEqual({
                3000: "",
                3001: "",
                3002: "",
                3003: "",
                3004: "",
                3005: "",
                3006: "",
                3007: "",
                3008: "",
                3009: ""
            });
        });

        it('should not wrap already grouped config', () => {
            const input = {
                "localhost": {
                    "Next.js": {
                        "bgcolor": "blue",
                        3000: "app",
                        3001: "api",
                        "3002-3009": "etc"
                    }
                }
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result).not.toHaveProperty('__NOTITLE');
            expect(result).toHaveProperty('localhost');
        });
    });

    describe('Step 3: Expand port ranges', () => {
        it('should expand port ranges in object keys', () => {
            const input = {
                "localhost": {
                    "Next.js": {
                        3000: "app",
                        3001: "api",
                        "3002-3005": "etc"
                    }
                }
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result.localhost["Next.js"]).toEqual({
                3000: "app",
                3001: "api",
                3002: "etc",
                3003: "etc",
                3004: "etc",
                3005: "etc"
            });
        });

        it('should expand port ranges in arrays', () => {
            const input = {
                "Next.js": [3000, 3001, "3002-3004"]
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result.__NOTITLE["Next.js"]).toEqual({
                3000: "",
                3001: "",
                3002: "",
                3003: "",
                3004: ""
            });
        });
    });

    describe('Step 4: Convert port arrays to objects', () => {
        it('should convert port arrays to port-label objects', () => {
            const input = {
                "Next.js": [3000, 3001, 3002]
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result.__NOTITLE["Next.js"]).toEqual({
                3000: "",
                3001: "",
                3002: ""
            });
        });

        it('should handle string port numbers in arrays', () => {
            const input = {
                "Services": ["3000", "3001", 3002]
            };
            const result = ConfigManager.processHostsConfig(input);
            expect(result.__NOTITLE.Services).toEqual({
                3000: "",
                3001: "",
                3002: ""
            });
        });
    });

    describe('Complete transformation examples', () => {
        it('should transform complex configuration example 1', () => {
            const input = {
                "localhost": {
                    "Next.js": {
                        3000: "app",
                        3001: "api",
                        "3002-3009": "etc"
                    },
                    "Web": ["http", "https"]
                },
                "127.0.0.1": {
                    "Services": ["ssh", "postgresql"],
                    "Development": [8080, "8081-8090"]
                }
            };
            const result = ConfigManager.processHostsConfig(input);
            
            // Check Next.js group
            expect(result.localhost["Next.js"]).toEqual({
                3000: "app",
                3001: "api",
                3002: "etc",
                3003: "etc",
                3004: "etc",
                3005: "etc",
                3006: "etc",
                3007: "etc",
                3008: "etc",
                3009: "etc"
            });

            // Check Web group (well-known ports converted)
            expect(result.localhost.Web).toEqual({
                80: "http",
                443: "https"
            });

            // Check Services group
            expect(result["127.0.0.1"].Services).toEqual({
                22: "ssh",
                5432: "postgresql"
            });

            // Check Development group (range expanded)
            expect(result["127.0.0.1"].Development).toEqual({
                8080: "",
                8081: "",
                8082: "",
                8083: "",
                8084: "",
                8085: "",
                8086: "",
                8087: "",
                8088: "",
                8089: "",
                8090: ""
            });
        });

        it('should transform simple configuration example', () => {
            const input = {
                "Next.js": [3000, 3001, "3002-3009"]
            };
            const result = ConfigManager.processHostsConfig(input);
            
            expect(result).toEqual({
                "__NOTITLE": {
                    "Next.js": {
                        3000: "",
                        3001: "",
                        3002: "",
                        3003: "",
                        3004: "",
                        3005: "",
                        3006: "",
                        3007: "",
                        3008: "",
                        3009: ""
                    }
                }
            });
        });
    });
});