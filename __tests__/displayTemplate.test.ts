import * as vscode from 'vscode';
import { PortMonitorExtension } from '../src/extension';
import { ConfigManager } from '../src/config';

// Mock vscode module
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(),
        onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() }))
    },
    commands: {
        registerCommand: jest.fn(() => ({ dispose: jest.fn() }))
    },
    window: {
        createStatusBarItem: jest.fn(() => ({
            show: jest.fn(),
            dispose: jest.fn(),
            alignment: 1,
            text: '',
            tooltip: '',
            backgroundColor: undefined
        })),
        showErrorMessage: jest.fn(),
        showInformationMessage: jest.fn(),
        showTextDocument: jest.fn(),
        openTextDocument: jest.fn()
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2
    },
    ThemeColor: jest.fn()
}));

// Mock monitor
jest.mock('../src/monitor', () => ({
    PortMonitor: jest.fn().mockImplementation(() => ({
        startMonitoring: jest.fn(),
        stopMonitoring: jest.fn(),
        forceUpdate: jest.fn()
    }))
}));

describe('Display Template System', () => {
    let extension: any;
    let mockContext: any;
    let mockGetConfiguration: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset ConfigManager singleton
        (ConfigManager as any).instance = null;
        
        mockGetConfiguration = jest.fn();
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: mockGetConfiguration
        });

        mockContext = {
            subscriptions: { push: jest.fn() }
        };
    });

    describe('buildDisplayTemplate', () => {
        it('should create port objects from hosts configuration', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return {
                            "TestGroup": {
                                "3000": "app",
                                "3001": "api"
                            }
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            
            // Access private property for testing
            const portObjects = (extension as any).portObjects;
            
            expect(portObjects['3000']).toEqual({
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'free',
                groupConfigs: expect.any(Object)
            });

            expect(portObjects['3001']).toEqual({
                port: 3001,
                label: 'api',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'free',
                groupConfigs: expect.any(Object)
            });
        });

        it('should apply port emojis correctly', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "TestGroup": { "3000": "app" } };
                    case 'portEmojis':
                        return { "app": "🚀" };
                    case 'emojiMode':
                        return 'replace';
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            const portObjects = (extension as any).portObjects;
            
            expect(portObjects['3000'].emoji).toBe('🚀');
            expect(portObjects['3000'].emojiMode).toBe('replace');
        });

        it('should apply port colors with correct priority', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "TestGroup": { "3000": "app" } };
                    case 'portColors':
                        return {
                            "TestGroup": "#blue",    // Group color
                            "app": "#green",         // Label color
                            "3000": "#red"           // Port color (highest priority)
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            const portObjects = (extension as any).portObjects;
            
            expect(portObjects['3000'].color).toBe('#red'); // Port number has highest priority
        });

        it('should create compact template for common prefix ports', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return {
                            "TestGroup": {
                                "3000": "app1",
                                "3001": "app2",
                                "3002": "app3",
                                "__CONFIG": {
                                    "compact": true,
                                    "show_title": false
                                }
                            }
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            const displayTemplate = (extension as any).displayTemplate;
            
            expect(displayTemplate).toBe('300[__PORT_3000|__PORT_3001|__PORT_3002]');
        });

        it('should create regular template for no common prefix', () => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return {
                            "TestGroup": {
                                "3000": "app1",
                                "8080": "app2",
                                "__CONFIG": {
                                    "compact": true
                                }
                            }
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            const displayTemplate = (extension as any).displayTemplate;
            
            expect(displayTemplate).toBe('TestGroup: [__PORT_3000|__PORT_8080]');
        });
    });

    describe('renderPortDisplay', () => {
        beforeEach(() => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "TestGroup": { "3000": "app" } };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
        });

        it('should render basic port display', () => {
            const portObj = {
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'inUse' as const
            };

            const result = (extension as any).renderPortDisplay(portObj);
            expect(result).toBe('🟢app:3000');
        });

        it('should render with suffix for compact display', () => {
            const portObj = {
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'inUse' as const
            };

            const result = (extension as any).renderPortDisplay(portObj, '0');
            expect(result).toBe('🟢app:0');
        });

        it('should render with emoji in replace mode', () => {
            const portObj = {
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'inUse' as const,
                emoji: '🚀',
                emojiMode: 'replace' as const
            };

            (extension as any).displayConfig = {
                statusIcons: { inUse: "🟢", free: "⚪️" },
                globalEmojiMode: 'replace'
            };

            const result = (extension as any).renderPortDisplay(portObj);
            expect(result).toBe('🚀app:3000');
        });

        it('should render with emoji in prefix mode', () => {
            const portObj = {
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'inUse' as const,
                emoji: '🚀',
                emojiMode: 'prefix' as const
            };

            (extension as any).displayConfig = {
                statusIcons: { inUse: "🟢", free: "⚪️" },
                globalEmojiMode: 'replace'
            };

            const result = (extension as any).renderPortDisplay(portObj);
            expect(result).toBe('🚀🟢app:3000');
        });
    });

    describe('processCompactDisplays', () => {
        beforeEach(() => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "TestGroup": { "3000": "app", "3001": "api" } };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            
            // Set up port objects with status
            (extension as any).portObjects = {
                '3000': {
                    port: 3000,
                    label: 'app',
                    group: 'TestGroup',
                    host: 'localhost',
                    statusIcon: 'inUse'
                },
                '3001': {
                    port: 3001,
                    label: 'api',
                    group: 'TestGroup',
                    host: 'localhost',
                    statusIcon: 'free'
                }
            };

            (extension as any).displayConfig = {
                statusIcons: { inUse: "🟢", free: "⚪️" },
                globalEmojiMode: 'replace'
            };
        });

        it('should process compact display with common prefix', () => {
            const template = '300[__PORT_3000|__PORT_3001]';
            const result = (extension as any).processCompactDisplays(template);
            
            expect(result).toBe('300[🟢app:0|⚪️api:1]');
        });

        it('should handle custom separator', () => {
            const template = '300[__PORT_3000 | __PORT_3001]';
            const result = (extension as any).processCompactDisplays(template);
            
            expect(result).toBe('300[🟢app:0 | ⚪️api:1]');
        });

        it('should not process non-compact patterns', () => {
            const template = 'TestGroup: __PORT_3000 __PORT_3001';
            const result = (extension as any).processCompactDisplays(template);
            
            expect(result).toBe('TestGroup: __PORT_3000 __PORT_3001');
        });
    });

    describe('onPortStatusChanged integration', () => {
        beforeEach(() => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return {
                            "TestGroup": {
                                "3000": "app",
                                "3001": "api",
                                "__CONFIG": {
                                    "compact": true,
                                    "show_title": false
                                }
                            }
                        };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
        });

        it('should update status and render correctly', () => {
            const results = [
                {
                    host: 'localhost',
                    port: 3000,
                    label: 'app',
                    group: 'TestGroup',
                    isOpen: true,
                    processName: 'node'
                },
                {
                    host: 'localhost',
                    port: 3001,
                    label: 'api',
                    group: 'TestGroup',
                    isOpen: false
                }
            ];

            (extension as any).onPortStatusChanged(results);
            
            const statusBarItem = (extension as any).statusBarItem;
            expect(statusBarItem.text).toBe('300[🟢app:0|⚪️api:1]');
        });
    });
});