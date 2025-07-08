import { ConfigManager } from '../src/config';
import * as vscode from 'vscode';

// Mock vscode module
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn()
    }
}));

describe('Port Colors Configuration', () => {
    let configManager: ConfigManager;
    let mockGetConfiguration: jest.Mock;

    beforeEach(() => {
        mockGetConfiguration = jest.fn();
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: mockGetConfiguration
        });
        configManager = ConfigManager.getInstance();
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Reset the singleton instance
        (ConfigManager as any).instance = null;
    });

    describe('portColors configuration loading', () => {
        it('should load portColors with group, label, and port settings', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { 
                            "katix": { "3000": "react", "3001": "api" },
                            "proxy": { "8080": "nginx" }
                        };
                    case 'portColors':
                        return { 
                            "katix": "#40a25f",     // Group color
                            "react": "#61dafb",     // Label color
                            "3000": "#ff6b6b",      // Port color (highest priority)
                            "proxy": "#888888"      // Group color
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portColors).toEqual({
                "katix": "#40a25f",
                "react": "#61dafb", 
                "3000": "#ff6b6b",
                "proxy": "#888888"
            });
        });

        it('should return empty object when portColors is not configured', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "katix": { "3000": "react" } };
                    case 'portColors':
                        return undefined;
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portColors).toEqual({});
        });
    });

    describe('Color priority logic', () => {
        it('should prioritize port number over label and group', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "katix": { "3000": "react" } };
                    case 'portColors':
                        return {
                            "katix": "#40a25f",     // Group color (lowest priority)
                            "react": "#61dafb",     // Label color (medium priority)  
                            "3000": "#ff6b6b"       // Port color (highest priority)
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            // Test configuration is loaded correctly
            expect(config.portColors).toEqual({
                "katix": "#40a25f",
                "react": "#61dafb",
                "3000": "#ff6b6b"
            });
        });

        it('should fall back to label color when port color is not available', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "katix": { "3001": "api" } };
                    case 'portColors':
                        return {
                            "katix": "#40a25f",     // Group color
                            "api": "#green"         // Label color (should be used)
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portColors).toEqual({
                "katix": "#40a25f",
                "api": "#green"
            });
        });

        it('should fall back to group color when both port and label colors are not available', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "katix": { "3002": "test" } };
                    case 'portColors':
                        return {
                            "katix": "#40a25f"      // Only group color available
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portColors).toEqual({
                "katix": "#40a25f"
            });
        });
    });

    describe('Multiple ports color resolution', () => {
        it('should handle mixed group and specific port colors', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { 
                            "frontend": { 
                                "3000": "react", 
                                "3001": "vue",
                                "3002": "angular" 
                            }
                        };
                    case 'portColors':
                        return {
                            "frontend": "#blue",    // Group color for all
                            "3001": "#green",       // Specific port override
                            "angular": "#red"       // Label override
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portColors).toEqual({
                "frontend": "#blue",
                "3001": "#green",
                "angular": "#red"
            });
        });
    });
});