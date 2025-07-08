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

describe('Background Color Application', () => {
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

    describe('applyBackgroundColor', () => {
        beforeEach(() => {
            mockGetConfiguration.mockImplementation((key: string) => {
                switch (key) {
                    case 'hosts':
                        return { "TestGroup": { "3000": "app" } };
                    case 'statusIcons':
                        return { inUse: "🟢", free: "⚪️" };
                    case 'backgroundColor':
                        return 'statusBarItem.warningBackground';
                    default:
                        return undefined;
                }
            });

            extension = new PortMonitorExtension(mockContext);
            
            // Set up port objects and display config
            (extension as any).portObjects = {
                '3000': {
                    port: 3000,
                    label: 'app',
                    group: 'TestGroup',
                    host: 'localhost',
                    statusIcon: 'inUse',
                    color: '#blue'
                }
            };

            (extension as any).displayConfig = {
                statusIcons: { inUse: "🟢", free: "⚪️" },
                backgroundColor: 'statusBarItem.warningBackground',
                globalEmojiMode: 'replace'
            };
        });

        it('should prioritize group bgcolor over other colors', () => {
            const results = [{
                host: 'localhost',
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                isOpen: true,
                groupConfigs: { bgcolor: 'statusBarItem.errorBackground' }
            }];

            (extension as any).applyBackgroundColor(results);

            expect((extension as any).statusBarItem.backgroundColor).toEqual(
                new vscode.ThemeColor('statusBarItem.errorBackground')
            );
        });

        it('should fall back to global backgroundColor when no group bgcolor', () => {
            const results = [{
                host: 'localhost',
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                isOpen: true
            }];

            (extension as any).applyBackgroundColor(results);

            expect((extension as any).statusBarItem.backgroundColor).toEqual(
                new vscode.ThemeColor('statusBarItem.warningBackground')
            );
        });

        it('should use port-specific color when no global background', () => {
            (extension as any).displayConfig.backgroundColor = undefined;

            const results = [{
                host: 'localhost',
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                isOpen: true
            }];

            (extension as any).applyBackgroundColor(results);

            expect((extension as any).statusBarItem.backgroundColor).toEqual(
                new vscode.ThemeColor('#blue')
            );
        });

        it('should prioritize in-use ports over free ports for colors', () => {
            (extension as any).displayConfig.backgroundColor = undefined;
            (extension as any).portObjects = {
                '3000': { port: 3000, statusIcon: 'free', color: '#red' },
                '3001': { port: 3001, statusIcon: 'inUse', color: '#blue' }
            };

            const results = [
                { host: 'localhost', port: 3000, isOpen: false },
                { host: 'localhost', port: 3001, isOpen: true }
            ];

            (extension as any).applyBackgroundColor(results);

            expect((extension as any).statusBarItem.backgroundColor).toEqual(
                new vscode.ThemeColor('#blue')
            );
        });

        it('should set backgroundColor to undefined when no color found', () => {
            (extension as any).displayConfig.backgroundColor = undefined;
            (extension as any).portObjects = {
                '3000': { port: 3000, statusIcon: 'free' } // No color property
            };

            const results = [{
                host: 'localhost',
                port: 3000,
                isOpen: false
            }];

            (extension as any).applyBackgroundColor(results);

            expect((extension as any).statusBarItem.backgroundColor).toBeUndefined();
        });
    });

    describe('Error handling in onPortStatusChanged', () => {
        it('should handle missing displayConfig gracefully', () => {
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
            
            // Clear display config to simulate error state
            (extension as any).displayConfig = null;
            (extension as any).displayTemplate = '';

            const results = [{
                host: 'localhost',
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                isOpen: true
            }];

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            (extension as any).onPortStatusChanged(results);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[PortMonitor] Display configuration not initialized'
            );

            consoleSpy.mockRestore();
        });

        it('should handle missing displayTemplate gracefully', () => {
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
            
            // Clear template to simulate error state
            (extension as any).displayTemplate = null;

            const results = [{
                host: 'localhost',
                port: 3000,
                label: 'app',
                group: 'TestGroup',
                isOpen: true
            }];

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            (extension as any).onPortStatusChanged(results);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[PortMonitor] Display configuration not initialized'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Port status updates', () => {
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
        });

        it('should update port status correctly', () => {
            const results = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: false }
            ];

            (extension as any).onPortStatusChanged(results);

            expect((extension as any).portObjects['3000'].statusIcon).toBe('inUse');
            expect((extension as any).portObjects['3001'].statusIcon).toBe('free');
        });

        it('should ignore status updates for non-existent ports', () => {
            const results = [
                { port: 9999, isOpen: true } // Port not in portObjects
            ];

            const originalPortObjects = { ...(extension as any).portObjects };

            (extension as any).onPortStatusChanged(results);

            expect((extension as any).portObjects).toEqual(originalPortObjects);
        });
    });
});