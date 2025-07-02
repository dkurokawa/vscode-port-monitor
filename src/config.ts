
import * as vscode from 'vscode';

export type HostsSimple = Record<string, Record<string, number>>;
export type HostsCustom = Record<string, (number | string)[]>;
export type ProcessedHosts = Record<string, Record<string, Record<number, string>>>;

export interface PortMonitorConfig {
    hosts: ProcessedHosts;
    portLabels?: Record<string, string>;
    statusIcons: {
        inUse: string;
        free: string;
    };
    intervalMs: number;
    backgroundColor?: string;
    portColors?: Record<string, string>;
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
        // Get settings without default values - use actual configured values only
        const rawHosts = this.config.get<any>('hosts');
        
        // If no configuration exists, provide useful defaults for development
        let configuredHosts;
        if (rawHosts !== undefined && Object.keys(rawHosts).length > 0) {
            // User has configuration - use it as-is (no merge with defaults)
            configuredHosts = rawHosts;
        } else {
            // No configuration - provide helpful defaults
            configuredHosts = {
                "Node.js": [3000, 3001, 3002, 3003]
            };
        }
        
        // Process hosts configuration through 4-step transformation
        const processedHosts = ConfigManager.processHostsConfig(configuredHosts);
        
        const portLabels = this.config.get<Record<string, string>>('portLabels') || {};
        
        // statusIcons: use configured value or default, with backward compatibility
        const rawStatusIcons = this.config.get<any>('statusIcons');
        let statusIcons;
        if (rawStatusIcons !== undefined) {
            // User has configured statusIcons - use their values
            statusIcons = {
                inUse: rawStatusIcons.inUse ?? rawStatusIcons.open ?? '🟢',
                free: rawStatusIcons.free ?? rawStatusIcons.closed ?? '⚪️'
            };
        } else {
            // No configuration - use defaults
            statusIcons = { inUse: '🟢', free: '⚪️' };
        }
        
        // Get other settings, using defaults only if not configured
        const intervalMs = this.config.get<number>('intervalMs');
        const backgroundColor = this.config.get<string>('backgroundColor');
        const portColors = this.config.get<Record<string, string>>('portColors');
        
        return {
            hosts: processedHosts,
            portLabels,
            statusIcons,
            intervalMs: Math.max(1000, intervalMs !== undefined ? intervalMs : 3000),
            backgroundColor,
            portColors
        };
    }

    public refresh(): void {
        this.config = vscode.workspace.getConfiguration('portMonitor');
    }


    public static validateConfig(config: PortMonitorConfig): string[] {
        const errors: string[] = [];

        // Validate monitoring interval
        if (config.intervalMs < 1000) {
            errors.push('intervalMs must be at least 1000ms');
        }

        // Validate processed hosts configuration
        for (const [host, groups] of Object.entries(config.hosts)) {
            if (typeof groups !== 'object' || groups === null) {
                errors.push(`hosts.${host} must be an object with groups`);
                continue;
            }
            for (const [groupName, ports] of Object.entries(groups)) {
                if (typeof ports !== 'object' || ports === null) {
                    errors.push(`hosts.${host}.${groupName} must be an object with port-label pairs`);
                    continue;
                }
                for (const [portStr, label] of Object.entries(ports)) {
                    const port = parseInt(portStr);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        errors.push(`Invalid port number: ${portStr} in hosts.${host}.${groupName} (must be 1-65535)`);
                    }
                    if (typeof label !== 'string') {
                        errors.push(`Invalid label type for port ${port} in hosts.${host}.${groupName} (must be string)`);
                    }
                }
            }
        }

        return errors;
    }


    /**
     * Generate monitoring target list from processed hosts config
     * @param config PortMonitorConfig
     * @returns Array<{host, port, label}>
     */
    public static parseHostsConfig(config: PortMonitorConfig): Array<{ host: string; port: number; label: string }> {
        const result: Array<{ host: string; port: number; label: string }> = [];
        
        // Process the already-transformed hosts config
        for (const [host, groups] of Object.entries(config.hosts)) {
            for (const [, ports] of Object.entries(groups)) {
                for (const [portStr, label] of Object.entries(ports)) {
                    const port = parseInt(portStr);
                    if (!isNaN(port) && port > 0 && port <= 65535) {
                        result.push({
                            host,
                            port,
                            label: label || ConfigManager.resolveLabelForPort(port, config.portLabels || {})
                        });
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * Resolve label from portLabels/pattern
     */
    public static resolveLabelForPort(port: number, portLabels: Record<string, string>): string {
        // Exact match has priority
        if (portLabels && portLabels[port.toString()]) {
            return portLabels[port.toString()];
        }
        // Pattern matching (with * or ? wildcards)
        const patterns = Object.keys(portLabels).filter(k => /[?*]/.test(k));
        if (patterns.length > 0) {
            // Use findBestMatch from patternMatcher.ts
            try {
                // Dynamic import to avoid circular references
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { PatternMatcher } = require('./patternMatcher');
                const matched = PatternMatcher.findBestMatch(patterns, port);
                if (matched) return portLabels[matched];
            } catch (error) {
                console.debug('Pattern matching failed:', error);
            }
        }
        // Fallback: empty string
        return '';
    }

    /**
     * Process hosts configuration through 4-step transformation
     */
    public static processHostsConfig(rawHosts: any): Record<string, Record<string, Record<number, string>>> {
        // Well-known ports mapping
        const wellKnownPorts: Record<string, number> = {
            'http': 80,
            'https': 443,
            'ssh': 22,
            'postgresql': 5432,
            'mysql': 3306,
            'ftp': 21,
            'smtp': 25,
            'pop3': 110,
            'imap': 143,
            'dns': 53,
            'telnet': 23,
            'ldap': 389,
            'ldaps': 636,
            'smtps': 465,
            'imaps': 993,
            'pop3s': 995
        };

        let processed = rawHosts;

        // Step 1: Replace well-known ports
        processed = ConfigManager.replaceWellKnownPorts(processed, wellKnownPorts);

        // Step 2: Add default group wrapper
        processed = ConfigManager.addDefaultGroupWrapper(processed);

        // Step 3: Expand port ranges
        processed = ConfigManager.expandPortRanges(processed);

        // Step 4: Convert port arrays to port-label objects
        processed = ConfigManager.convertPortArraysToObjects(processed);

        return processed;
    }

    private static replaceWellKnownPorts(config: any, wellKnownPorts: Record<string, number>): any {
        if (Array.isArray(config)) {
            // For arrays, check if all items are well-known ports that should be converted to object
            const hasWellKnownPorts = config.some(item => typeof item === 'string' && wellKnownPorts[item]);
            if (hasWellKnownPorts && config.every(item => typeof item === 'string' && wellKnownPorts[item])) {
                // Convert array of only well-known ports to port-label object
                const portObject: Record<number, string> = {};
                for (const item of config) {
                    if (typeof item === 'string' && wellKnownPorts[item]) {
                        portObject[wellKnownPorts[item]] = item;
                    }
                }
                return portObject;
            } else {
                // Otherwise, just replace well-known port names with numbers
                return config.map(item => {
                    if (typeof item === 'string' && wellKnownPorts[item]) {
                        return wellKnownPorts[item];
                    }
                    return ConfigManager.replaceWellKnownPorts(item, wellKnownPorts);
                });
            }
        } else if (typeof config === 'object' && config !== null) {
            const result: any = {};
            for (const [key, value] of Object.entries(config)) {
                result[key] = ConfigManager.replaceWellKnownPorts(value, wellKnownPorts);
            }
            return result;
        }
        return config;
    }

    private static addDefaultGroupWrapper(config: any): any {
        // Check if config needs group wrapper by examining if values are arrays or simple port objects
        // This should detect the "simple" format that needs wrapping
        const needsWrapper = Object.values(config).some(value => {
            if (Array.isArray(value)) {
                return true;
            }
            // Check if value is a simple port-label object (all keys are port numbers)
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const keys = Object.keys(value);
                const allKeysArePortNumbers = keys.every(key => {
                    const num = parseInt(key);
                    return !isNaN(num) && num > 0 && num <= 65535;
                });
                return allKeysArePortNumbers;
            }
            return false;
        });
        
        if (needsWrapper) {
            return {
                "__NOTITLE": config
            };
        }
        
        return config;
    }

    private static expandPortRanges(config: any): any {
        if (typeof config !== 'object' || config === null) {
            return config;
        }

        if (Array.isArray(config)) {
            const expanded: any[] = [];
            for (const item of config) {
                if (typeof item === 'string' && /^\d+-\d+$/.test(item)) {
                    const [start, end] = item.split('-').map(Number);
                    for (let port = start; port <= end; port++) {
                        expanded.push(port);
                    }
                } else {
                    expanded.push(ConfigManager.expandPortRanges(item));
                }
            }
            return expanded;
        }

        const result: any = {};
        for (const [key, value] of Object.entries(config)) {
            if (typeof key === 'string' && /^\d+-\d+$/.test(key)) {
                // Expand range key
                const [start, end] = key.split('-').map(Number);
                for (let port = start; port <= end; port++) {
                    result[port] = value;
                }
            } else {
                result[key] = ConfigManager.expandPortRanges(value);
            }
        }
        return result;
    }

    private static convertPortArraysToObjects(config: any): any {
        if (typeof config !== 'object' || config === null) {
            return config;
        }

        if (Array.isArray(config)) {
            // Convert array to port-label object
            const portObject: Record<number, string> = {};
            for (const item of config) {
                if (typeof item === 'number') {
                    portObject[item] = '';
                } else if (typeof item === 'string' && /^\d+$/.test(item)) {
                    portObject[parseInt(item)] = '';
                }
            }
            return portObject;
        }

        const result: any = {};
        for (const [key, value] of Object.entries(config)) {
            if (Array.isArray(value)) {
                // Convert array to port-label object, preserving non-port properties
                const portObject: Record<number, string> = {};
                for (const item of value) {
                    if (typeof item === 'number') {
                        portObject[item] = '';
                    } else if (typeof item === 'string' && /^\d+$/.test(item)) {
                        portObject[parseInt(item)] = '';
                    }
                }
                result[key] = portObject;
            } else if (typeof value === 'object' && value !== null) {
                // For objects, filter out non-port properties and recurse on nested objects
                const processedValue: any = {};
                for (const [subKey, subValue] of Object.entries(value)) {
                    if (typeof subValue === 'object' || Array.isArray(subValue)) {
                        processedValue[subKey] = ConfigManager.convertPortArraysToObjects(subValue);
                    } else if (typeof subValue === 'string' || typeof subValue === 'number') {
                        // Keep port-label pairs and other simple values
                        const portNum = parseInt(subKey);
                        if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
                            processedValue[portNum] = subValue;
                        } else if (subKey !== 'bgcolor') { // Skip non-port properties like bgcolor
                            processedValue[subKey] = subValue;
                        }
                    }
                }
                result[key] = processedValue;
            } else {
                result[key] = value;
            }
        }
        return result;
    }
}
