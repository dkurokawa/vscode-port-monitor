import * as vscode from 'vscode';

export interface PortMonitorConfig {
    hosts: Record<string, Record<string, number>>;
    statusIcons: {
        open: string;
        closed: string;
    };
    intervalMs: number;
}

export interface PortInfo {
    host: string;
    port: number;
    label: string;
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
            hosts: this.config.get('hosts', { 
                localhost: { 
                    admin: 3000, 
                    app: 3001, 
                    user: 3002 
                } 
            }),
            statusIcons: this.config.get('statusIcons', { open: '🟢', closed: '🔴' }),
            intervalMs: Math.max(1000, this.config.get('intervalMs', 3000))
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
        for (const [host, labeledPorts] of Object.entries(config.hosts)) {
            if (typeof labeledPorts !== 'object' || labeledPorts === null) {
                errors.push(`hosts.${host} must be an object with labeled ports`);
                continue;
            }
            
            for (const [label, port] of Object.entries(labeledPorts)) {
                if (typeof port !== 'number') {
                    errors.push(`hosts.${host}.${label} must be a number`);
                } else if (port < 1 || port > 65535) {
                    errors.push(`Invalid port number: ${port} (must be 1-65535)`);
                }
            }
        }

        return errors;
    }

    /**
     * Parse labeled ports configuration to port info array
     * @param hostsConfig Host configuration with labeled ports
     * @returns Array of port information
     */
    public static parseHostsConfig(hostsConfig: Record<string, Record<string, number>>): Array<{
        host: string;
        port: number;
        label: string;
    }> {
        const result: Array<{ host: string; port: number; label: string; }> = [];
        
        for (const [host, labeledPorts] of Object.entries(hostsConfig)) {
            for (const [label, port] of Object.entries(labeledPorts)) {
                if (typeof port === 'number') {
                    result.push({ host, port, label });
                }
            }
        }
        
        return result;
    }
}
