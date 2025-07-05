
import * as vscode from 'vscode';

export type HostsSimple = Record<string, Record<string, number>>;
export type HostsCustom = Record<string, (number | string)[]>;
export type ProcessedHosts = Record<string, Record<string, Record<number, string>>>;

export interface GroupSettings {
    [key: string]: any;
}

export interface GroupConfigs {
    compact?: boolean;
    bgcolor?: string;
    separator?: string;
    show_title?: boolean;
}

export type ProcessedHostsWithSettings = Record<string, GroupSettings & GroupConfigs>;

export interface PortMonitorConfig {
    hosts: ProcessedHostsWithSettings;
    portLabels?: Record<string, string>;
    statusIcons: {
        inUse: string;
        free: string;
    };
    intervalMs: number;
    backgroundColor?: string;
    portColors?: Record<string, string>;
    statusBarPosition?: 'left' | 'right';
}

export interface PortInfo {
    host: string;
    port: number;
    label: string;
    group: string;
    groupConfigs?: GroupConfigs;
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
        const statusBarPosition = this.config.get<'left' | 'right'>('statusBarPosition');
        
        return {
            hosts: processedHosts,
            portLabels,
            statusIcons,
            intervalMs: Math.max(1000, intervalMs !== undefined ? intervalMs : 3000),
            backgroundColor,
            portColors,
            statusBarPosition
        };
    }

    public refresh(): void {
        this.config = vscode.workspace.getConfiguration('portMonitor');
    }


    public static validateRawConfig(rawConfig: any): string[] {
        const errors: string[] = [];

        // Validate monitoring interval
        if (rawConfig.intervalMs !== undefined && rawConfig.intervalMs < 1000) {
            errors.push('intervalMs must be at least 1000ms');
        }

        // Validate raw hosts configuration (before processing)
        if (rawConfig.hosts && typeof rawConfig.hosts === 'object') {
            try {
                // Check for common configuration mistakes
                const configErrors = ConfigManager.validateHostsStructure(rawConfig.hosts);
                errors.push(...configErrors);
                
                // Try to process the configuration to validate it
                ConfigManager.processHostsConfig(rawConfig.hosts);
            } catch (error) {
                errors.push(`Invalid hosts configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return errors;
    }

    /**
     * Validate hosts configuration structure and provide helpful error messages
     */
    public static validateHostsStructure(hosts: any): string[] {
        const errors: string[] = [];

        if (!hosts || typeof hosts !== 'object') {
            errors.push('hosts must be an object');
            return errors;
        }

        // Check if hosts is empty
        if (Object.keys(hosts).length === 0) {
            errors.push('No ports configured. Add ports to monitor in settings.');
            return errors;
        }

        // Check for common mistakes
        for (const [hostKey, hostValue] of Object.entries(hosts)) {
            if (!hostValue || typeof hostValue !== 'object') {
                errors.push(`Host "${hostKey}" must have port configuration`);
                continue;
            }

            // Detect reversed port-label configuration
            const entries = Object.entries(hostValue);
            let hasPortAsKey = false;
            let hasPortAsValue = false;
            let hasInvalidStructure = false;

            for (const [key, value] of entries) {
                const keyAsNum = parseInt(key);
                const valueAsNum = typeof value === 'number' ? value : parseInt(value as string);

                // Check if key looks like a port number
                if (!isNaN(keyAsNum) && keyAsNum > 0 && keyAsNum <= 65535) {
                    hasPortAsKey = true;
                }

                // Check if value looks like a port number
                if (!isNaN(valueAsNum) && valueAsNum > 0 && valueAsNum <= 65535) {
                    hasPortAsValue = true;
                }

                // Check for invalid structure
                if (Array.isArray(value)) {
                    // Arrays are valid
                } else if (typeof value === 'object' && value !== null) {
                    // Objects are valid (nested groups)
                } else if (typeof value !== 'string' && typeof value !== 'number') {
                    hasInvalidStructure = true;
                }
            }

            // Detect likely reversed configuration
            if (hasPortAsValue && !hasPortAsKey) {
                errors.push(`Host "${hostKey}": Port numbers should be keys, not values. 
Current: {"${Object.keys(hostValue)[0]}": ${Object.values(hostValue)[0]}}
Correct: {"${Object.values(hostValue)[0]}": "${Object.keys(hostValue)[0]}"}`);
            }

            // Detect mixed configuration
            if (hasPortAsKey && hasPortAsValue) {
                errors.push(`Host "${hostKey}": Mixed configuration detected. Use consistent format: {"3000": "label", "3001": "label"}`);
            }

            if (hasInvalidStructure) {
                errors.push(`Host "${hostKey}": Invalid port configuration. Use {"port": "label"} or {"group": [3000, 3001]} format`);
            }

            // Check for empty host name
            if (hostKey === '') {
                errors.push('Empty host name detected. Use "localhost" instead of ""');
            }

            // Check for obviously wrong host names
            if (hostKey.match(/^\d+$/)) {
                errors.push(`Host "${hostKey}": Host name looks like a port number. Use "localhost" or proper hostname`);
            }

            // Check for common port range mistakes
            for (const [key, value] of entries) {
                if (typeof key === 'string' && key.includes('-') && typeof value === 'string') {
                    // Likely port range in wrong place
                    errors.push(`Host "${hostKey}": Port range "${key}" detected. Use array format: {"group": ["3000-3005"]} or {"3000-3005": "label"}`);
                }
            }
        }

        return errors;
    }

    public static validateConfig(config: PortMonitorConfig): string[] {
        const errors: string[] = [];

        // Validate monitoring interval
        if (config.intervalMs < 1000) {
            errors.push('intervalMs must be at least 1000ms');
        }

        // Basic validation for processed hosts configuration
        if (!config.hosts || typeof config.hosts !== 'object') {
            errors.push('Processed hosts configuration is invalid');
            return errors;
        }

        return errors;
    }


    /**
     * Generate monitoring target list from processed hosts config
     * @param config PortMonitorConfig
     * @returns Array<{host, port, label, group, groupConfigs}>
     */
    public static parseHostsConfig(config: PortMonitorConfig): Array<{ host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs }> {
        const result: Array<{ host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs }> = [];
        
        // Default group config values
        const defaultGroupConfigs: GroupConfigs = {
            compact: false,
            separator: '|',
            show_title: true
        };
        
        // Process the already-transformed hosts config
        for (const [groupName, groupData] of Object.entries(config.hosts)) {
            ConfigManager.processGroupData(groupName, groupData, defaultGroupConfigs, result, config.portLabels || {});
        }
        
        return result;
    }
    
    private static processGroupData(groupName: string, groupData: any, defaultGroupConfigs: GroupConfigs, result: Array<{ host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs }>, portLabels: Record<string, string>) {
        // Check if this is a nested structure (like __NOTITLE with sub-groups)
        const hasNestedGroups = Object.values(groupData).some(value => 
            typeof value === 'object' && value !== null && !Array.isArray(value) &&
            Object.keys(value).some(key => {
                const port = parseInt(key);
                return !isNaN(port) && port > 0 && port <= 65535;
            })
        );
        
        if (hasNestedGroups && groupName === '__NOTITLE') {
            // Handle nested groups under __NOTITLE
            for (const [subGroupName, subGroupData] of Object.entries(groupData)) {
                if (!subGroupName.startsWith('__')) {
                    ConfigManager.processGroupData(subGroupName, subGroupData, defaultGroupConfigs, result, portLabels);
                }
            }
        } else {
            // Handle direct port mapping
            const groupConfigs = { ...defaultGroupConfigs, ...(groupData as any).__CONFIG };
            
            // Get port entries (all keys except those starting with __)
            const portEntries = Object.entries(groupData).filter(([key]) => !key.startsWith('__'));
            
            for (const [portStr, label] of portEntries) {
                const port = parseInt(portStr);
                if (!isNaN(port) && port > 0 && port <= 65535) {
                    result.push({
                        host: 'localhost', // All ports are assumed to be on localhost
                        port,
                        label: (typeof label === 'string' ? label : '') || ConfigManager.resolveLabelForPort(port, portLabels),
                        group: groupName,
                        groupConfigs
                    });
                }
            }
        }
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
     * Process hosts configuration through 5-step transformation
     * Each step handles one specific transformation to ensure testability and maintainability
     */
    public static processHostsConfig(rawHosts: any): ProcessedHostsWithSettings {
        let processed = rawHosts;

        // Step 1: Replace well-known port names with port numbers
        processed = ConfigManager.step1_ReplaceWellKnownPorts(processed);

        // Step 2: Expand port ranges (e.g., "3000-3005" -> [3000, 3001, 3002, 3003, 3004, 3005])
        processed = ConfigManager.step2_ExpandPortRanges(processed);

        // Step 3: Add default group wrapper for ungrouped configurations
        processed = ConfigManager.step3_AddDefaultGroupWrapper(processed);

        // Step 4: Convert port arrays to port-label objects
        processed = ConfigManager.step4_ConvertArraysToObjects(processed);

        // Step 5: Normalize structure and validate final format
        processed = ConfigManager.step5_NormalizeStructure(processed);

        return processed;
    }

    /**
     * Step 1: Replace well-known port names with port numbers
     * Input: Any configuration with string port names like "http", "https", "postgresql"
     * Output: Same structure but with port names replaced by numbers and labels tracked
     */
    private static step1_ReplaceWellKnownPorts(config: any): any {
        const wellKnownPorts: Record<string, number> = {
            'http': 80,
            'https': 443,
            'ssh': 22,
            'postgresql': 5432,
            'mysql': 3306,
            'redis': 6379,
            'mongodb': 27017,
            'elasticsearch': 9200,
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
        
        return ConfigManager.replaceWellKnownPortsRecursive(config, wellKnownPorts);
    }
    
    private static replaceWellKnownPortsRecursive(config: any, wellKnownPorts: Record<string, number>): any {
        if (Array.isArray(config)) {
            // Replace well-known port names with objects containing port number and original name
            return config.map(item => {
                if (typeof item === 'string' && wellKnownPorts[item]) {
                    return { __port: wellKnownPorts[item], __originalName: item };
                }
                return ConfigManager.replaceWellKnownPortsRecursive(item, wellKnownPorts);
            });
        } else if (typeof config === 'object' && config !== null) {
            const result: any = {};
            for (const [key, value] of Object.entries(config)) {
                // Replace well-known port names in keys
                const newKey = (typeof key === 'string' && wellKnownPorts[key]) ? wellKnownPorts[key].toString() : key;
                result[newKey] = ConfigManager.replaceWellKnownPortsRecursive(value, wellKnownPorts);
            }
            return result;
        }
        return config;
    }

    /**
     * Step 2: Expand port ranges like \"3000-3005\" into individual ports [3000, 3001, 3002, 3003, 3004, 3005]
     * Input: Configuration with possible port ranges as strings (may include __port objects)
     * Output: Same structure but with port ranges expanded to individual ports
     */
    private static step2_ExpandPortRanges(config: any): any {
        if (typeof config !== 'object' || config === null) {
            return config;
        }

        if (Array.isArray(config)) {
            const expanded: any[] = [];
            for (const item of config) {
                if (typeof item === 'string' && /^\d+-\d+$/.test(item)) {
                    // Expand range
                    const [start, end] = item.split('-').map(Number);
                    for (let port = start; port <= end; port++) {
                        expanded.push(port);
                    }
                } else if (typeof item === 'object' && item.__port && item.__originalName) {
                    // Pass through well-known port objects unchanged
                    expanded.push(item);
                } else {
                    expanded.push(ConfigManager.step2_ExpandPortRanges(item));
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
                result[key] = ConfigManager.step2_ExpandPortRanges(value);
            }
        }
        return result;
    }
    
    /**
     * Step 3: Add default group wrapper for configurations that need grouping
     * Input: Configuration that may be flat arrays or direct port mappings
     * Output: Properly grouped configuration with __NOTITLE wrapper when needed
     */
    private static step3_AddDefaultGroupWrapper(config: any): any {
        // Handle empty config
        if (!config || Object.keys(config).length === 0) {
            return {};
        }
        
        // Check if config is a direct port-label mapping at top level
        const isDirectPortMapping = Object.keys(config).every(key => {
            const num = parseInt(key);
            return !isNaN(num) && num > 0 && num <= 65535;
        });
        
        if (isDirectPortMapping) {
            // Direct port mapping: {"3000": "user", "3001": "car"}
            // Convert to: {"__NOTITLE": {"3000": "user", "3001": "car"}}
            return {
                "__NOTITLE": config
            };
        }
        
        // Handle empty host name by converting to localhost
        if (config[""] && typeof config[""] === 'object') {
            const newConfig = { ...config };
            newConfig["localhost"] = config[""];
            delete newConfig[""];
            config = newConfig;
        }
        
        // Check if config needs group wrapper by examining if values are arrays
        const needsWrapper = Object.values(config).some(value => Array.isArray(value));
        
        if (needsWrapper) {
            return {
                "__NOTITLE": config
            };
        }
        
        return config;
    }

    /**
     * Step 4: Convert port arrays to port-label objects
     * Input: Configuration with arrays of ports (may include __port/__originalName objects)
     * Output: Configuration with port-label object mappings
     */
    private static step4_ConvertArraysToObjects(config: any): any {
        if (typeof config !== 'object' || config === null) {
            return config;
        }

        if (Array.isArray(config)) {
            // Convert array to port-label mapping
            const portObject: Record<string, string> = {};
            for (const item of config) {
                if (typeof item === 'number') {
                    portObject[item.toString()] = '';
                } else if (typeof item === 'string' && /^\d+$/.test(item)) {
                    portObject[item] = '';
                } else if (typeof item === 'object' && item.__port && item.__originalName) {
                    // Handle well-known port with original name
                    portObject[item.__port.toString()] = item.__originalName;
                }
            }
            return portObject;
        }

        const result: any = {};
        for (const [key, value] of Object.entries(config)) {
            if (Array.isArray(value)) {
                // Convert array to port-label mapping
                const portObject: Record<string, string> = {};
                for (const item of value) {
                    if (typeof item === 'number') {
                        portObject[item.toString()] = '';
                    } else if (typeof item === 'string' && /^\d+$/.test(item)) {
                        portObject[item] = '';
                    } else if (typeof item === 'object' && item.__port && item.__originalName) {
                        // Handle well-known port with original name
                        portObject[item.__port.toString()] = item.__originalName;
                    }
                }
                result[key] = portObject;
            } else {
                result[key] = ConfigManager.step4_ConvertArraysToObjects(value);
            }
        }
        return result;
    }
    
    /**
     * Step 5: Normalize structure and validate final format
     * Input: Configuration with mixed structures
     * Output: Clean, normalized configuration ready for use
     */
    private static step5_NormalizeStructure(config: any): any {
        if (typeof config !== 'object' || config === null) {
            return config;
        }

        const result: any = {};
        for (const [key, value] of Object.entries(config)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Normalize nested objects
                result[key] = ConfigManager.step5_NormalizeStructure(value);
            } else {
                result[key] = value;
            }
        }
        return result;
    }
    
    // Legacy method - kept for backward compatibility but no longer used
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
            // Convert array to direct port-label mapping
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
                // Convert array to direct port-label mapping
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
                // Process nested objects recursively
                result[key] = ConfigManager.convertPortArraysToObjects(value);
            } else {
                result[key] = value;
            }
        }
        return result;
    }
}
