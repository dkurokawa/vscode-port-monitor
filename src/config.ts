import * as vscode from 'vscode';

export interface PortMonitorConfig {
    hosts: Record<string, (string | number)[] | Record<string, (string | number)[]>>;
    portLabels: Record<string, string>;
    statusIcons: {
        open: string;
        closed: string;
    };
    intervalMs: number;
    enableProcessKill: boolean;
    confirmBeforeKill: boolean;
    enableLogViewer: boolean;
    logBufferSize: number;
    autoScrollLog: boolean;
    displayOptions: {
        separator: string;
        showFullPortNumber: boolean;
        compactRanges: boolean;
        maxDisplayLength: number;
        statusBarPosition: 'left' | 'right';
        statusBarPriority: number;
    };
}

export interface PortInfo {
    host: string;
    port: number;
    label?: string;
    category?: string;
    isOpen: boolean;
    pid?: number;
    processName?: string;
}

export class ConfigManager {
    private static instance: ConfigManager;
    private config: vscode.WorkspaceConfiguration;

    private constructor() {
        this.config = vscode.workspace.getConfiguration('portMonitor');
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public getConfig(): PortMonitorConfig {
        return {
            hosts: this.config.get('hosts', {}),
            portLabels: this.config.get('portLabels', {}),
            statusIcons: this.config.get('statusIcons', { open: '🟢', closed: '🔴' }),
            intervalMs: Math.max(1000, this.config.get('intervalMs', 3000)),
            enableProcessKill: this.config.get('enableProcessKill', true),
            confirmBeforeKill: this.config.get('confirmBeforeKill', true),
            enableLogViewer: this.config.get('enableLogViewer', true),
            logBufferSize: this.config.get('logBufferSize', 1000),
            autoScrollLog: this.config.get('autoScrollLog', true),
            displayOptions: {
                separator: this.config.get('displayOptions.separator', '|'),
                showFullPortNumber: this.config.get('displayOptions.showFullPortNumber', false),
                compactRanges: this.config.get('displayOptions.compactRanges', true),
                maxDisplayLength: this.config.get('displayOptions.maxDisplayLength', 100),
                statusBarPosition: this.config.get('displayOptions.statusBarPosition', 'right'),
                statusBarPriority: this.config.get('displayOptions.statusBarPriority', 200)
            }
        };
    }

    public refresh(): void {
        this.config = vscode.workspace.getConfiguration('portMonitor');
    }

    public validateConfig(config: PortMonitorConfig): string[] {
        const errors: string[] = [];

        // Validate monitoring interval
        if (config.intervalMs < 1000) {
            errors.push('intervalMs must be at least 1000ms');
        }

        // Validate host configuration
        for (const [host, ports] of Object.entries(config.hosts)) {
            // Support both simple array and category-based object format
            if (Array.isArray(ports)) {
                // Simple array case
                for (const port of ports) {
                    if (typeof port === 'number') {
                        if (port < 1 || port > 65535) {
                            errors.push(`Invalid port number: ${port} (must be 1-65535)`);
                        }
                    } else if (typeof port === 'string') {
                        // Port range and well-known name validation will be implemented later
                        continue;
                    } else {
                        errors.push(`Invalid port type in hosts.${host}: ${typeof port}`);
                    }
                }
            } else if (typeof ports === 'object' && ports !== null) {
                // Category-based object case
                for (const [category, categoryPorts] of Object.entries(ports)) {
                    if (!Array.isArray(categoryPorts)) {
                        errors.push(`hosts.${host}.${category} must be an array`);
                        continue;
                    }
                    
                    for (const port of categoryPorts) {
                        if (typeof port === 'number') {
                            if (port < 1 || port > 65535) {
                                errors.push(`Invalid port number: ${port} (must be 1-65535)`);
                            }
                        } else if (typeof port === 'string') {
                            // Port range and well-known name validation will be implemented later
                            continue;
                        } else {
                            errors.push(`Invalid port type in hosts.${host}.${category}: ${typeof port}`);
                        }
                    }
                }
            } else {
                errors.push(`hosts.${host} must be an array or object`);
            }
        }

        return errors;
    }

    /**
     * Convert host configuration to unified format (category-based configuration support)
     * @param hostsConfig Host configuration
     * @returns Configuration array in unified format
     */
    public static parseHostsConfig(hostsConfig: Record<string, (string | number)[] | Record<string, (string | number)[]>>): Array<{
        host: string;
        category?: string;
        ports: number[];
    }> {
        const result: Array<{ host: string; category?: string; ports: number[]; }> = [];
        
        for (const [host, config] of Object.entries(hostsConfig)) {
            if (Array.isArray(config)) {
                // Simple array case
                const ports = this.expandPorts(config);
                result.push({ host, ports });
            } else if (typeof config === 'object' && config !== null) {
                // Category-based object case
                for (const [category, categoryPorts] of Object.entries(config)) {
                    if (Array.isArray(categoryPorts)) {
                        const ports = this.expandPorts(categoryPorts);
                        result.push({ host, category, ports });
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * Expand port array (convert range specifications and well-known names to numeric values)
     * @param ports Port array
     * @returns Expanded numeric port array
     */
    private static expandPorts(ports: (string | number)[]): number[] {
        const expanded: number[] = [];
        
        for (const port of ports) {
            if (typeof port === 'number') {
                expanded.push(port);
            } else if (typeof port === 'string') {
                // Range specification case (e.g., "3000-3005")
                if (port.includes('-')) {
                    const [start, end] = port.split('-').map(Number);
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let p = start; p <= end; p++) {
                            expanded.push(p);
                        }
                    }
                } else {
                    // Well-known name case
                    const wellKnownPort = this.getWellKnownPort(port);
                    if (wellKnownPort) {
                        expanded.push(wellKnownPort);
                    }
                }
            }
        }
        
        return expanded;
    }

    /**
     * Get port number from well-known name
     * @param name Well-known name
     * @returns Port number
     */
    private static getWellKnownPort(name: string): number | undefined {
        const wellKnownPorts: Record<string, number> = {
            'http': 80,
            'https': 443,
            'ssh': 22,
            'ftp': 21,
            'smtp': 25,
            'dns': 53,
            'dhcp': 67,
            'pop3': 110,
            'imap': 143,
            'snmp': 161,
            'postgresql': 5432,
            'mysql': 3306,
            'redis': 6379,
            'mongodb': 27017
        };
        
        return wellKnownPorts[name.toLowerCase()];
    }
}
