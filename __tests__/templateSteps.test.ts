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
        showErrorMessage: jest.fn()
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

describe('Template Building Steps', () => {
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

        // Basic configuration for all tests
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
    });

    describe('createPortObjectsFromHosts', () => {
        it('should create port objects with correct structure', () => {
            const hostConfigs = [
                { host: 'localhost', port: 3000, label: 'app', group: 'TestGroup', groupConfigs: {} },
                { host: 'localhost', port: 3001, label: 'api', group: 'TestGroup', groupConfigs: {} }
            ];

            // Reset and call the method directly
            (extension as any).portObjects = {};
            (extension as any).createPortObjectsFromHosts(hostConfigs);

            const portObjects = (extension as any).portObjects;

            expect(portObjects['3000']).toEqual({
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'free',
                groupConfigs: {}
            });

            expect(portObjects['3001']).toEqual({
                port: 3001,
                label: 'api',
                group: 'TestGroup',
                host: 'localhost',
                statusIcon: 'free',
                groupConfigs: {}
            });
        });
    });

    describe('applyPortLabels', () => {
        it('should apply port labels to existing ports', () => {
            // Set up initial port objects
            (extension as any).portObjects = {
                '3000': { port: 3000, label: 'defaultLabel' },
                '3001': { port: 3001, label: 'anotherDefault' }
            };

            const portLabels = {
                '3000': 'customLabel',
                '3001': 'anotherCustom'
            };

            (extension as any).applyPortLabels(portLabels);

            expect((extension as any).portObjects['3000'].label).toBe('customLabel');
            expect((extension as any).portObjects['3001'].label).toBe('anotherCustom');
        });

        it('should ignore labels for non-existent ports', () => {
            (extension as any).portObjects = {
                '3000': { port: 3000, label: 'defaultLabel' }
            };

            const portLabels = {
                '3000': 'customLabel',
                '9999': 'shouldBeIgnored'
            };

            (extension as any).applyPortLabels(portLabels);

            expect((extension as any).portObjects['3000'].label).toBe('customLabel');
            expect((extension as any).portObjects['9999']).toBeUndefined();
        });

        it('should handle undefined portLabels', () => {
            (extension as any).portObjects = {
                '3000': { port: 3000, label: 'originalLabel' }
            };

            (extension as any).applyPortLabels(undefined);

            expect((extension as any).portObjects['3000'].label).toBe('originalLabel');
        });
    });

    describe('applyPortEmojis', () => {
        beforeEach(() => {
            (extension as any).portObjects = {
                '3000': { port: 3000, label: 'app' },
                '3001': { port: 3001, label: 'api' }
            };
        });

        it('should apply string emojis with global mode', () => {
            const portEmojis = {
                'app': '🚀',
                'api': '🔧'
            };

            (extension as any).applyPortEmojis(portEmojis, 'replace');

            expect((extension as any).portObjects['3000'].emoji).toBe('🚀');
            expect((extension as any).portObjects['3000'].emojiMode).toBe('replace');
            expect((extension as any).portObjects['3001'].emoji).toBe('🔧');
            expect((extension as any).portObjects['3001'].emojiMode).toBe('replace');
        });

        it('should apply detailed emoji config', () => {
            const portEmojis = {
                'app': { prefix: '🚀' },
                'api': { replace: '🔧' }
            };

            (extension as any).applyPortEmojis(portEmojis, 'suffix');

            expect((extension as any).portObjects['3000'].emoji).toEqual({ prefix: '🚀' });
            expect((extension as any).portObjects['3000'].emojiMode).toBeUndefined();
            expect((extension as any).portObjects['3001'].emoji).toEqual({ replace: '🔧' });
            expect((extension as any).portObjects['3001'].emojiMode).toBeUndefined();
        });

        it('should ignore emojis for non-matching labels', () => {
            const portEmojis = {
                'nonexistent': '🚀'
            };

            (extension as any).applyPortEmojis(portEmojis, 'replace');

            expect((extension as any).portObjects['3000'].emoji).toBeUndefined();
            expect((extension as any).portObjects['3001'].emoji).toBeUndefined();
        });
    });

    describe('applyPortColors', () => {
        beforeEach(() => {
            (extension as any).portObjects = {
                '3000': { port: 3000, label: 'app', group: 'Frontend' },
                '3001': { port: 3001, label: 'api', group: 'Backend' }
            };
        });

        it('should apply colors with correct priority (port > label > group)', () => {
            const portColors = {
                'Frontend': '#blue',        // Group color
                'app': '#green',           // Label color  
                '3000': '#red',            // Port color (highest priority)
                'Backend': '#yellow'       // Group color only
            };

            (extension as any).applyPortColors(portColors);

            expect((extension as any).portObjects['3000'].color).toBe('#red');    // Port wins
            expect((extension as any).portObjects['3001'].color).toBe('#yellow'); // Group only
        });

        it('should fall back to label when port color not available', () => {
            const portColors = {
                'Frontend': '#blue',
                'app': '#green'
            };

            (extension as any).applyPortColors(portColors);

            expect((extension as any).portObjects['3000'].color).toBe('#green'); // Label fallback
        });

        it('should fall back to group when neither port nor label available', () => {
            const portColors = {
                'Frontend': '#blue'
            };

            (extension as any).applyPortColors(portColors);

            expect((extension as any).portObjects['3000'].color).toBe('#blue'); // Group fallback
        });

        it('should handle undefined portColors', () => {
            (extension as any).applyPortColors(undefined);

            expect((extension as any).portObjects['3000'].color).toBeUndefined();
            expect((extension as any).portObjects['3001'].color).toBeUndefined();
        });
    });

    describe('createCompactTemplate', () => {
        it('should create compact template with common prefix', () => {
            const ports = [
                { port: 3000 },
                { port: 3001 },
                { port: 3002 }
            ];

            const result = (extension as any).createCompactTemplate(ports, '|');
            
            expect(result).toBe('300[__PORT_3000|__PORT_3001|__PORT_3002]');
        });

        it('should create regular bracket template without common prefix', () => {
            const ports = [
                { port: 3000 },
                { port: 8080 }
            ];

            const result = (extension as any).createCompactTemplate(ports, '|');
            
            expect(result).toBe('[__PORT_3000|__PORT_8080]');
        });

        it('should handle custom separator', () => {
            const ports = [
                { port: 3000 },
                { port: 3001 }
            ];

            const result = (extension as any).createCompactTemplate(ports, ' | ');
            
            expect(result).toBe('300[__PORT_3000 | __PORT_3001]');
        });

        it('should return empty string for empty ports array', () => {
            const result = (extension as any).createCompactTemplate([], '|');
            
            expect(result).toBe('');
        });

        it('should handle single port', () => {
            const ports = [{ port: 3000 }];

            const result = (extension as any).createCompactTemplate(ports, '|');
            
            expect(result).toBe('3000[__PORT_3000]'); // Single port gets full prefix
        });
    });
});