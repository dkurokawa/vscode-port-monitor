import { ConfigManager } from '../src/config';

describe('Configuration Validation', () => {
    
    describe('validateRawConfig', () => {
        
        it('should pass valid configuration', () => {
            const validConfig = {
                hosts: {
                    "Development": {
                        "3000": "app",
                        "3001": "api"
                    }
                },
                intervalMs: 3000
            };
            
            const errors = ConfigManager.validateRawConfig(validConfig);
            expect(errors).toHaveLength(0);
        });

        it('should detect intervalMs too small', () => {
            const invalidConfig = {
                hosts: {},
                intervalMs: 500
            };
            
            const errors = ConfigManager.validateRawConfig(invalidConfig);
            expect(errors).toContain('intervalMs must be at least 1000ms');
        });
    });

    describe('validateHostsStructure', () => {
        
        it('should detect reversed port-label configuration', () => {
            const reversedConfig = {
                "localhost": {
                    "user": 3000,
                    "car": 3001
                }
            };
            
            const errors = ConfigManager.validateHostsStructure(reversedConfig);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('Port numbers should be keys, not values');
        });

        it('should detect empty host name', () => {
            const emptyHostConfig = {
                "": {
                    "3000": "app"
                }
            };
            
            const errors = ConfigManager.validateHostsStructure(emptyHostConfig);
            expect(errors).toContain('Empty host name detected. Use "localhost" instead of ""');
        });

        it('should detect host name as port number', () => {
            const portAsHostConfig = {
                "3000": {
                    "app": "main"
                }
            };
            
            const errors = ConfigManager.validateHostsStructure(portAsHostConfig);
            expect(errors[0]).toContain('Host name looks like a port number');
        });

        it('should detect mixed configuration format', () => {
            const mixedConfig = {
                "localhost": {
                    "3000": "app",     // correct
                    "api": 3001,       // incorrect
                    "5432": "database" // correct
                }
            };
            
            const errors = ConfigManager.validateHostsStructure(mixedConfig);
            expect(errors[0]).toContain('Mixed configuration detected');
        });

        it('should handle empty configuration', () => {
            const emptyConfig = {};
            const errors = ConfigManager.validateHostsStructure(emptyConfig);
            expect(errors).toContain('No ports configured. Add ports to monitor in settings.');
        });

        it('should pass correct configuration', () => {
            const correctConfig = {
                "Development": {
                    "3000": "react",
                    "3001": "vue",
                    "__CONFIG": {
                        "compact": true
                    }
                },
                "Database": {
                    "5432": "postgres"
                }
            };
            
            const errors = ConfigManager.validateHostsStructure(correctConfig);
            expect(errors).toHaveLength(0);
        });
    });
});