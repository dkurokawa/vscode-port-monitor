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
            
            // Get initial configuration for status bar position
            const initialConfig = this.configManager.getConfig();
            const alignment = initialConfig.statusBarPosition === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;
            this.statusBarItem = vscode.window.createStatusBarItem(alignment, 200);
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
        
        // Validate raw configuration before processing
        const rawConfig = vscode.workspace.getConfiguration('portMonitor');
        const validationErrors = ConfigManager.validateRawConfig({
            hosts: rawConfig.get('hosts'),
            intervalMs: rawConfig.get('intervalMs'),
            portLabels: rawConfig.get('portLabels'),
            statusIcons: rawConfig.get('statusIcons'),
            backgroundColor: rawConfig.get('backgroundColor'),
            portColors: rawConfig.get('portColors')
        });
        
        if (validationErrors.length > 0) {
            vscode.window.showErrorMessage(`Port Monitor configuration error: ${validationErrors.join(', ')}`);
            return;
        }

        // Get processed configuration
        const config = this.configManager.getConfig();
        
        // Check if status bar position changed and recreate if necessary
        const currentAlignment = this.statusBarItem.alignment;
        const newAlignment = config.statusBarPosition === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;
        
        if (currentAlignment !== newAlignment) {
            // Dispose current status bar item and create new one with correct alignment
            const currentText = this.statusBarItem.text;
            const currentTooltip = this.statusBarItem.tooltip;
            this.statusBarItem.dispose();
            
            this.statusBarItem = vscode.window.createStatusBarItem(newAlignment, 200);
            this.statusBarItem.command = 'portMonitor.refresh';
            this.statusBarItem.text = currentText;
            this.statusBarItem.tooltip = currentTooltip;
            this.statusBarItem.show();
        }

        // Stop current monitoring
        if (this.currentMonitorId) {
            this.monitor.stopMonitoring(this.currentMonitorId);
        }

        // Parse configuration (mode support)
        const hostConfigs = ConfigManager.parseHostsConfig(config);

        if (hostConfigs.length === 0) {
            // Check if there are configuration errors to show helpful messages
            const rawConfig = vscode.workspace.getConfiguration('portMonitor');
            const structureErrors = ConfigManager.validateHostsStructure(rawConfig.get('hosts') || {});
            
            if (structureErrors.length > 0) {
                this.statusBarItem.text = "Port Monitor: Configuration Error";
                this.statusBarItem.tooltip = `Configuration Issues:\n${structureErrors.join('\n')}\n\nClick to open settings`;
            } else {
                this.statusBarItem.text = "Port Monitor: No ports configured";
                this.statusBarItem.tooltip = "Add ports to monitor in settings.\nExample: {\"localhost\": {\"3000\": \"app\", \"3001\": \"api\"}}\n\nClick to open settings";
            }
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
        // Group by host and then by group for better organization
        const hostGroups = results.reduce((acc, port) => {
            if (!acc[port.host]) {
                acc[port.host] = {};
            }
            if (!acc[port.host][port.group]) {
                acc[port.host][port.group] = [];
            }
            acc[port.host][port.group].push(port);
            return acc;
        }, {} as Record<string, Record<string, PortInfo[]>>);

        // Generate display text using group information from config
        const hostDisplays: string[] = [];

        for (const [host, groups] of Object.entries(hostGroups)) {
            const groupDisplays: string[] = [];
            
            for (const [groupName, ports] of Object.entries(groups)) {
                // Get group configs from first port (all ports in a group share configs)
                const groupConfigs = ports[0]?.groupConfigs;
                const isCompact = groupConfigs?.compact === true;
                const separator = groupConfigs?.separator || '|';
                const showTitle = groupConfigs?.show_title !== false; // default true
                
                if (isCompact) {
                    // Compact mode: find common prefix and create range display
                    const compactDisplay = this.createCompactDisplay(ports, config.statusIcons, separator);
                    
                    if (groupName.startsWith('__NOTITLE') || groupName === '' || !showTitle) {
                        groupDisplays.push(compactDisplay);
                    } else {
                        groupDisplays.push(`${groupName}: ${compactDisplay}`);
                    }
                } else {
                    // Normal mode: individual port display
                    const portDisplays = ports.map(port => {
                        const icon = port.isOpen ? config.statusIcons.inUse : config.statusIcons.free;
                        return `${icon}${port.label}:${port.port}`;
                    });
                    
                    if (groupName.startsWith('__NOTITLE') || groupName === '' || !showTitle) {
                        groupDisplays.push(portDisplays.join(' '));
                    } else {
                        groupDisplays.push(`${groupName}:[${portDisplays.join(separator)}]`);
                    }
                }
            }
            
            // Since we're using flat structure, all hosts are localhost - don't show host name
            hostDisplays.push(groupDisplays.join(' '));
        }

        const displayText = hostDisplays.join(' ');
        console.log('[PortMonitor] StatusBar displayText:', displayText);
        this.statusBarItem.text = displayText;
        this.statusBarItem.tooltip = this.generateTooltip(results);

        // Background color setting - priority: group bgcolor > global backgroundColor > portColors
        let backgroundColor: string | undefined;
        
        // Check for group-level bgcolor (highest priority)
        for (const port of results) {
            if (port.groupConfigs?.bgcolor) {
                backgroundColor = port.groupConfigs.bgcolor;
                break;
            }
        }
        
        // Fall back to global backgroundColor
        if (!backgroundColor && config.backgroundColor) {
            backgroundColor = config.backgroundColor;
        }
        
        // Fall back to port-specific colors
        if (!backgroundColor && config.portColors) {
            // Color of first inUse port, otherwise free port color, otherwise undefined
            for (const port of results) {
                if (port.isOpen && config.portColors[port.port.toString()]) {
                    backgroundColor = config.portColors[port.port.toString()];
                    break;
                }
            }
            if (!backgroundColor) {
                for (const port of results) {
                    if (!port.isOpen && config.portColors[port.port.toString()]) {
                        backgroundColor = config.portColors[port.port.toString()];
                        break;
                    }
                }
            }
        }
        
        this.statusBarItem.backgroundColor = backgroundColor ? new vscode.ThemeColor(backgroundColor) : undefined;
    }

    private createCompactDisplay(ports: PortInfo[], statusIcons: { inUse: string; free: string }, separator: string): string {
        if (ports.length === 0) return '';
        
        // Find common prefix for port numbers
        const portNumbers = ports.map(p => p.port).sort((a, b) => a - b);
        let commonPrefix = '';
        
        // Find the longest common prefix among port numbers
        const minPort = portNumbers[0].toString();
        const maxPort = portNumbers[portNumbers.length - 1].toString();
        
        for (let i = 0; i < Math.min(minPort.length, maxPort.length); i++) {
            if (minPort[i] === maxPort[i]) {
                commonPrefix += minPort[i];
            } else {
                break;
            }
        }
        
        // If common prefix is meaningful (at least 2 digits), use compact format
        if (commonPrefix.length >= 2) {
            const portDisplays = ports.map(port => {
                const icon = port.isOpen ? statusIcons.inUse : statusIcons.free;
                const suffix = port.port.toString().substring(commonPrefix.length);
                const label = port.label ? `${port.label}:` : '';
                return `${icon}${label}${suffix}`;
            });
            
            return `${commonPrefix}[${portDisplays.join(separator)}]`;
        } else {
            // Fall back to normal display if no meaningful prefix
            const portDisplays = ports.map(port => {
                const icon = port.isOpen ? statusIcons.inUse : statusIcons.free;
                return `${icon}${port.label}:${port.port}`;
            });
            
            return `[${portDisplays.join(separator)}]`;
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
