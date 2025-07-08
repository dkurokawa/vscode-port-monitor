import * as vscode from 'vscode';
import { ConfigManager, PortInfo, PortMonitorConfig, PortEmojiConfig, GroupConfigs } from './config';
import { PortMonitor } from './monitor';

interface PortObject {
    port: number;
    label: string;
    group: string;
    host: string;
    statusIcon: 'free' | 'inUse';
    emoji?: string | PortEmojiConfig;
    emojiMode?: 'prefix' | 'replace' | 'suffix';
    groupConfigs?: GroupConfigs;
    color?: string;
}

export class PortMonitorExtension {
    private statusBarItem: vscode.StatusBarItem;
    private monitor: PortMonitor;
    private configManager: ConfigManager;
    private currentMonitorId?: string;
    private disposables: vscode.Disposable[] = [];
    private displayTemplate: string = '';
    private portObjects: Record<string, PortObject> = {};
    private displayConfig: {
        statusIcons: { inUse: string; free: string };
        backgroundColor?: string;
        globalEmojiMode: 'prefix' | 'replace' | 'suffix';
    } | null = null;

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
            backgroundColor: rawConfig.get('backgroundColor')
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
        console.log('[PortMonitor] Parsed host configs:', hostConfigs);

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

        // Build display template and port objects
        this.buildDisplayTemplate(config, hostConfigs);

        // Start monitoring
        this.currentMonitorId = await this.monitor.startMonitoring(
            hostConfigs,
            config.intervalMs,
            (results) => this.onPortStatusChanged(results)
        );
    }

    private buildDisplayTemplate(config: PortMonitorConfig, hostConfigs: Array<{ host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs }>): void {
        // Reset port objects
        this.portObjects = {};
        
        // Store display configuration
        this.displayConfig = {
            statusIcons: config.statusIcons,
            backgroundColor: config.backgroundColor,
            globalEmojiMode: config.emojiMode || 'replace'
        };

        // Step 1: Create port objects from hosts configuration
        this.createPortObjectsFromHosts(hostConfigs);
        
        // Step 2: Apply port labels
        this.applyPortLabels(config.portLabels);
        
        // Step 3: Apply port emojis
        this.applyPortEmojis(config.portEmojis, config.emojiMode);
        
        // Step 4: Build display template
        this.buildTemplate(hostConfigs);
    }

    private createPortObjectsFromHosts(hostConfigs: Array<{ host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs }>): void {
        for (const config of hostConfigs) {
            const key = config.port.toString();
            this.portObjects[key] = {
                port: config.port,
                label: config.label,
                group: config.group,
                host: config.host,
                statusIcon: 'free',
                groupConfigs: config.groupConfigs
            };
        }
    }

    private applyPortLabels(portLabels?: Record<string, string>): void {
        if (!portLabels) return;
        
        for (const [port, label] of Object.entries(portLabels)) {
            if (this.portObjects[port]) {
                this.portObjects[port].label = label;
            }
        }
    }

    private applyPortEmojis(portEmojis?: Record<string, string | PortEmojiConfig>, globalMode?: 'prefix' | 'replace' | 'suffix'): void {
        if (!portEmojis) return;
        
        for (const [port, portObj] of Object.entries(this.portObjects)) {
            const emoji = portEmojis[portObj.label];
            if (emoji) {
                portObj.emoji = emoji;
                if (typeof emoji === 'string') {
                    portObj.emojiMode = globalMode;
                }
            }
        }
    }


    private buildTemplate(hostConfigs: Array<{ host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs }>): void {
        // Group ports by host and group
        const groupedPorts: Record<string, Record<string, typeof hostConfigs>> = {};
        
        for (const config of hostConfigs) {
            if (!groupedPorts[config.host]) {
                groupedPorts[config.host] = {};
            }
            if (!groupedPorts[config.host][config.group]) {
                groupedPorts[config.host][config.group] = [];
            }
            groupedPorts[config.host][config.group].push(config);
        }
        
        const hostDisplays: string[] = [];
        
        for (const [host, groups] of Object.entries(groupedPorts)) {
            const groupDisplays: string[] = [];
            
            for (const [groupName, ports] of Object.entries(groups)) {
                const groupConfigs = ports[0]?.groupConfigs;
                const isCompact = groupConfigs?.compact === true;
                const separator = groupConfigs?.separator || '|';
                const showTitle = groupConfigs?.show_title !== false;
                
                let groupDisplay: string;
                
                if (isCompact) {
                    groupDisplay = this.createCompactTemplate(ports, separator);
                } else {
                    const portTemplates = ports.map(p => `__PORT_${p.port}`);
                    groupDisplay = portTemplates.join(' ');
                }
                
                if (showTitle && groupName && !groupName.startsWith('__NOTITLE')) {
                    groupDisplay = `${groupName}: ${groupDisplay}`;
                }
                
                groupDisplays.push(groupDisplay);
            }
            
            hostDisplays.push(groupDisplays.join(' '));
        }
        
        this.displayTemplate = hostDisplays.join(' ');
    }

    private createCompactTemplate(ports: Array<{ port: number }>, separator: string): string {
        if (ports.length === 0) return '';
        
        // Find common prefix
        const portNumbers = ports.map(p => p.port).sort((a, b) => a - b);
        let commonPrefix = '';
        
        const minPort = portNumbers[0].toString();
        const maxPort = portNumbers[portNumbers.length - 1].toString();
        
        for (let i = 0; i < Math.min(minPort.length, maxPort.length); i++) {
            if (minPort[i] === maxPort[i]) {
                commonPrefix += minPort[i];
            } else {
                break;
            }
        }
        
        const portTemplates = ports.map(p => `__PORT_${p.port}`);
        
        if (commonPrefix.length >= 2) {
            // Compact format with common prefix
            return `${commonPrefix}[${portTemplates.join(separator)}]`;
        } else {
            // Regular bracket format
            return `[${portTemplates.join(separator)}]`;
        }
    }

    private onPortStatusChanged(results: PortInfo[]): void {
        if (!this.displayConfig || !this.displayTemplate) {
            console.error('[PortMonitor] Display configuration not initialized');
            return;
        }

        // Update port status in portObjects
        for (const result of results) {
            const portKey = result.port.toString();
            if (this.portObjects[portKey]) {
                this.portObjects[portKey].statusIcon = result.isOpen ? 'inUse' : 'free';
            }
        }

        // Replace template placeholders with actual port displays
        let displayText = this.displayTemplate;
        
        // Handle compact display replacements first
        displayText = this.processCompactDisplays(displayText);
        
        // Replace remaining individual port placeholders
        for (const [portKey, portObj] of Object.entries(this.portObjects)) {
            const placeholder = `__PORT_${portObj.port}`;
            if (displayText.includes(placeholder)) {
                const portDisplay = this.renderPortDisplay(portObj);
                displayText = displayText.replace(placeholder, portDisplay);
            }
        }
        
        console.log('[PortMonitor] StatusBar displayText:', displayText);
        this.statusBarItem.text = displayText;
        this.statusBarItem.tooltip = this.generateTooltip(results);

        // Apply background color
        this.applyBackgroundColor(results);
    }

    private renderPortDisplay(portObj: PortObject, suffixForCompact?: string): string {
        if (!this.displayConfig) return '';
        
        const statusIcon = portObj.statusIcon === 'inUse' 
            ? this.displayConfig.statusIcons.inUse 
            : this.displayConfig.statusIcons.free;

        // Use suffix for compact display, otherwise full port number
        const displayPort = suffixForCompact || portObj.port.toString();

        if (portObj.emoji) {
            const emojiMode = portObj.emojiMode || this.displayConfig.globalEmojiMode;
            
            if (typeof portObj.emoji === 'string') {
                // Simple string emoji
                switch (emojiMode) {
                    case 'prefix':
                        return `${portObj.emoji}${statusIcon}${portObj.label}:${displayPort}`;
                    case 'replace':
                        const displayIcon = portObj.statusIcon === 'inUse' ? portObj.emoji : this.displayConfig.statusIcons.free;
                        return `${displayIcon}${portObj.label}:${displayPort}`;
                    case 'suffix':
                        return `${statusIcon}${portObj.label}${portObj.emoji}:${displayPort}`;
                }
            } else {
                // Detailed emoji configuration
                if (portObj.emoji.prefix) {
                    return `${portObj.emoji.prefix}${statusIcon}${portObj.label}:${displayPort}`;
                } else if (portObj.emoji.replace) {
                    const displayIcon = portObj.statusIcon === 'inUse' ? portObj.emoji.replace : this.displayConfig.statusIcons.free;
                    return `${displayIcon}${portObj.label}:${displayPort}`;
                } else if (portObj.emoji.suffix) {
                    return `${statusIcon}${portObj.label}${portObj.emoji.suffix}:${displayPort}`;
                }
            }
        }

        // Default display without emoji
        return `${statusIcon}${portObj.label}:${displayPort}`;
    }

    private applyBackgroundColor(results: PortInfo[]): void {
        let backgroundColor: string | undefined;

        // 1. Check for group-level bgcolor (highest priority)
        for (const port of results) {
            if (port.groupConfigs?.bgcolor) {
                backgroundColor = port.groupConfigs.bgcolor;
                break;
            }
        }

        // 2. Fall back to global backgroundColor
        if (!backgroundColor && this.displayConfig?.backgroundColor) {
            backgroundColor = this.displayConfig.backgroundColor;
        }

        // 3. Convert simple color names to theme colors
        if (backgroundColor) {
            backgroundColor = this.convertColorNameToThemeColor(backgroundColor);
        }

        this.statusBarItem.backgroundColor = backgroundColor ? new vscode.ThemeColor(backgroundColor) : undefined;
    }

    private convertColorNameToThemeColor(color: string): string {
        const colorMap: Record<string, string> = {
            'red': 'statusBarItem.errorBackground',
            'yellow': 'statusBarItem.warningBackground', 
            'blue': 'statusBarItem.prominentBackground',
            'green': 'statusBarItem.remoteBackground'
        };
        
        return colorMap[color.toLowerCase()] || color;
    }

    private processCompactDisplays(displayText: string): string {
        // Find compact display patterns: commonPrefix[__PORT_xxx separator __PORT_yyy]
        const compactPattern = /(\d{2,})\[([^\]]+)\]/g;
        
        return displayText.replace(compactPattern, (match, commonPrefix, content) => {
            // Detect separator by finding the pattern between port placeholders
            const portMatches = content.match(/__PORT_\d+/g);
            let separator = '|'; // default
            
            if (portMatches && portMatches.length > 1) {
                // Extract separator from between first two ports
                const firstPortEnd = content.indexOf(portMatches[0]) + portMatches[0].length;
                const secondPortStart = content.indexOf(portMatches[1]);
                if (secondPortStart > firstPortEnd) {
                    separator = content.substring(firstPortEnd, secondPortStart);
                }
            }
            
            // Split by the detected separator
            const parts = content.split(separator);
            const portDisplays: string[] = [];
            
            for (const part of parts) {
                const trimmed = part.trim();
                const portMatch = trimmed.match(/__PORT_(\d+)/);
                
                if (portMatch) {
                    const portNumber = parseInt(portMatch[1]);
                    const portObj = this.portObjects[portNumber.toString()];
                    
                    if (portObj) {
                        // Calculate suffix for compact display
                        const suffix = portNumber.toString().substring(commonPrefix.length);
                        const portDisplay = this.renderPortDisplay(portObj, suffix);
                        portDisplays.push(portDisplay);
                    }
                } else {
                    // Non-port content, keep as is
                    portDisplays.push(trimmed);
                }
            }
            
            return `${commonPrefix}[${portDisplays.join(separator)}]`;
        });
    }

    // Legacy methods removed - replaced with new template-based system

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
