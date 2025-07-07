import { ConfigManager } from '../src/config';
import * as vscode from 'vscode';

// Mock vscode module
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn()
    }
}));

describe('Port Emojis Configuration', () => {
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

    describe('portEmojis configuration loading', () => {
        it('should load portEmojis from configuration', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "Dev": { "3000": "car", "3001": "user", "3002": "ai-cam", "3003": "proxy" } };
                    case 'portEmojis':
                        return { "car": "🚗", "user": "🙂", "ai-cam": "🤖", "proxy": "🍡" };
                    case 'emojiMode':
                        return 'replace';
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    case 'intervalMs':
                        return 3000;
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portEmojis).toBeDefined();
            expect(config.portEmojis).toEqual({
                "car": "🚗",
                "user": "🙂",
                "ai-cam": "🤖",
                "proxy": "🍡"
            });
        });

        it('should return empty object when portEmojis is not configured', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "Dev": [3000, 3001, 3002] };
                    case 'portEmojis':
                        return undefined;
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    case 'intervalMs':
                        return 3000;
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.portEmojis).toBeDefined();
            expect(config.portEmojis).toEqual({});
        });
    });

    describe('Emoji mode configuration', () => {
        it('should load emojiMode from configuration', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "Dev": { "3000": "car" } };
                    case 'portEmojis':
                        return { "car": "🚗" };
                    case 'emojiMode':
                        return 'prefix';
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.emojiMode).toBe('prefix');
        });

        it('should default to "replace" when emojiMode is not configured', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "Dev": { "3000": "car" } };
                    case 'portEmojis':
                        return { "car": "🚗" };
                    case 'emojiMode':
                        return undefined;
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            expect(config.emojiMode).toBe('replace');
        });
    });

    describe('Status bar display with port emojis', () => {
        it('should support replace mode (default)', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "Dev": { "3000": "car" } };
                    case 'portEmojis':
                        return { "car": "🚗" };
                    case 'emojiMode':
                        return 'replace';
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            // Expected display format in replace mode:
            // - In use: 🚗car:3000 (emoji replaces status icon)
            // - Free: ⚪️car:3000 (keeps free icon)
            expect(config.portEmojis?.["car"]).toBe("🚗");
            expect(config.emojiMode).toBe("replace");
            expect(config.statusIcons.free).toBe("⚪️");
        });

        it('should support individual port emoji configuration', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "Dev": { "3000": "car", "3001": "user", "3002": "ai-cam" } };
                    case 'portEmojis':
                        return { 
                            "car": "🚗",  // Simple format - uses global emojiMode
                            "user": { "prefix": "🙂" },  // Individual prefix mode
                            "ai-cam": { "replace": "🤖" }  // Individual replace mode
                        };
                    case 'emojiMode':
                        return 'replace';  // Global default
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            const config = configManager.getConfig();
            
            // Test simple format
            expect(config.portEmojis?.["car"]).toBe("🚗");
            
            // Test individual configurations
            expect(config.portEmojis?.["user"]).toEqual({ "prefix": "🙂" });
            expect(config.portEmojis?.["ai-cam"]).toEqual({ "replace": "🤖" });
        });
    });
});