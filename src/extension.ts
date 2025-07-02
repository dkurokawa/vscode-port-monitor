import * as vscode from 'vscode';
import { ConfigManager, PortInfo, PortMonitorConfig } from './config';
import { PortMonitor } from './monitor';

export class PortMonitorExtension {
    private statusBarItem: vscode.StatusBarItem;
    private monitor: PortMonitor;
    private configManager: ConfigManager;
    private currentMonitorId?: string;
    private disposables: vscode.Disposable[] = [];

    constructor(private _context: vscode.ExtensionContext) {
        try {
            console.log('Initializing PortMonitorExtension...');
            this.monitor = new PortMonitor();
            this.configManager = ConfigManager.getInstance();
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
            this.statusBarItem.command = 'portMonitor.refresh';
            this.statusBarItem.show();
            
            this.initialize();
            console.log('PortMonitorExtension initialized successfully');
        } catch (error) {
            console.error('Error initializing PortMonitorExtension:', error);
            throw error;
        }
    }

    private initialize(): void {
        // Watch for configuration changes
        const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('portMonitor')) {
                this.onConfigurationChanged();
            }
        });
        this.disposables.push(configChangeDisposable);

        // Register commands
        this.registerCommands();

        // Load initial configuration and start monitoring
        this.onConfigurationChanged();
    }

    private registerCommands(): void {
        try {
            console.log('Registering commands...');
            const commands = [
                vscode.commands.registerCommand('portMonitor.refresh', () => this.refreshPortStatus()),
                vscode.commands.registerCommand('portMonitor.showLog', (portInfo?: PortInfo) => this.showProcessLog(portInfo)),
                vscode.commands.registerCommand('portMonitor.openSettings', () => this.openSettings())
            ];

            this.disposables.push(...commands);
            console.log('Commands registered successfully');
        } catch (error) {
            console.error('Failed to register commands:', error);
            throw error;
        }
    }

    private async onConfigurationChanged(): Promise<void> {
        this.configManager.refresh();
        const config = this.configManager.getConfig();

        // Validate configuration
        const errors = ConfigManager.validateConfig(config);
        if (errors.length > 0) {
            vscode.window.showErrorMessage(`Port Monitor configuration error: ${errors.join(', ')}`);
            return;
        }

        // Stop current monitoring
        if (this.currentMonitorId) {
            this.monitor.stopMonitoring(this.currentMonitorId);
        }

        // Parse configuration (mode support)
        const hostConfigs = ConfigManager.parseHostsConfig(config);

        if (hostConfigs.length === 0) {
            this.statusBarItem.text = "Port Monitor: No ports configured";
            this.statusBarItem.tooltip = "Click to open settings";
            return;
        }

        // Start monitoring
        this.currentMonitorId = await this.monitor.startMonitoring(
            hostConfigs,
            config.intervalMs,
            (results) => this.onPortStatusChanged(results, config)
        );
    }

    private onPortStatusChanged(results: PortInfo[], config: PortMonitorConfig): void {
        // Group by host and then by config groups for better organization
        const hostGroups = results.reduce((acc, port) => {
            if (!acc[port.host]) {
                acc[port.host] = [];
            }
            acc[port.host].push(port);
            return acc;
        }, {} as Record<string, PortInfo[]>);

        // Generate display text using group information from config
        const hostDisplays: string[] = [];

        for (const [host, ports] of Object.entries(hostGroups)) {
            const portDisplays = ports.map(port => {
                const icon = port.isOpen ? config.statusIcons.inUse : config.statusIcons.free;
                return `${icon}${port.label}:${port.port}`;
            });
            
            if (host === 'localhost') {
                hostDisplays.push(`[${portDisplays.join('|')}]`);
            } else {
                hostDisplays.push(`${host}:[${portDisplays.join('|')}]`);
            }
        }

        const displayText = hostDisplays.join(' ');
        console.log('[PortMonitor] StatusBar displayText:', displayText);
        this.statusBarItem.text = displayText;
        this.statusBarItem.tooltip = this.generateTooltip(results);

        // Background color setting - simplified since mode is no longer used
        if (config.backgroundColor) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor(config.backgroundColor);
        } else if (config.portColors) {
            // Color of first inUse port, otherwise free port color, otherwise undefined
            let color: string | undefined;
            for (const port of results) {
                if (port.isOpen && config.portColors[port.port.toString()]) {
                    color = config.portColors[port.port.toString()];
                    break;
                }
            }
            if (!color) {
                for (const port of results) {
                    if (!port.isOpen && config.portColors[port.port.toString()]) {
                        color = config.portColors[port.port.toString()];
                        break;
                    }
                }
            }
            this.statusBarItem.backgroundColor = color ? new vscode.ThemeColor(color) : undefined;
        } else {
            this.statusBarItem.backgroundColor = undefined;
        }
    }

    private generateTooltip(results: PortInfo[]): string {
        const lines = results.map(port => {
            const status = port.isOpen ? 'IN USE' : 'FREE';
            let line = `${port.host}:${port.port} (${port.label}) - ${status}`;
            if (port.isOpen && port.processName) {
                line += ` - ${port.processName}`;
                if (port.pid) {
                    line += ` (PID: ${port.pid})`;
                }
            }
            return line;
        });
        return lines.join('\n');
    }

    private async refreshPortStatus(): Promise<void> {
        if (this.currentMonitorId) {
            await this.monitor.forceUpdate(this.currentMonitorId);
            vscode.window.showInformationMessage('Port status refreshed');
        }
    }

    private async showProcessLog(portInfo?: PortInfo): Promise<void> {
        if (!portInfo) {
            vscode.window.showInformationMessage('Please select a port first');
            return;
        }

        if (!portInfo.isOpen) {
            vscode.window.showInformationMessage('Port is not in use');
            return;
        }

        // Simple log viewing - open a new document
        const doc = await vscode.workspace.openTextDocument({
            content: `Port ${portInfo.port} on ${portInfo.host} (${portInfo.label})\n` +
                    `Process: ${portInfo.processName || 'Unknown'}\n` +
                    `PID: ${portInfo.pid || 'Unknown'}\n\n` +
                    `Log monitoring is available in future versions.\n` +
                    `Click the status bar to refresh or check process details.`,
            language: 'plaintext'
        });
        await vscode.window.showTextDocument(doc);
    }

    private openSettings(): void {
        vscode.commands.executeCommand('workbench.action.openSettings', 'portMonitor');
    }

    public dispose(): void {
        if (this.currentMonitorId) {
            this.monitor.stopMonitoring(this.currentMonitorId);
        }
        
        this.statusBarItem.dispose();
        
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('PortMonitor extension activating...');
    
    try {
        const extension = new PortMonitorExtension(context);
        context.subscriptions.push(extension);
        console.log('PortMonitor extension activated successfully');
    } catch (error) {
        console.error('Failed to activate PortMonitor extension:', error);
        vscode.window.showErrorMessage(`Port Monitor activation failed: ${error}`);
    }
}

export function deactivate() {
    // Extension cleanup is handled by dispose()
}
