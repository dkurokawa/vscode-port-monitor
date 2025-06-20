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

        // 監視間隔の検証
        if (config.intervalMs < 1000) {
            errors.push('intervalMs must be at least 1000ms');
        }

        // ホスト設定の検証
        for (const [host, ports] of Object.entries(config.hosts)) {
            // 単純配列またはカテゴリ別オブジェクトの両方をサポート
            if (Array.isArray(ports)) {
                // 単純配列の場合
                for (const port of ports) {
                    if (typeof port === 'number') {
                        if (port < 1 || port > 65535) {
                            errors.push(`Invalid port number: ${port} (must be 1-65535)`);
                        }
                    } else if (typeof port === 'string') {
                        // ポート範囲やwell-known名の検証は後で実装
                        continue;
                    } else {
                        errors.push(`Invalid port type in hosts.${host}: ${typeof port}`);
                    }
                }
            } else if (typeof ports === 'object' && ports !== null) {
                // カテゴリ別オブジェクトの場合
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
                            // ポート範囲やwell-known名の検証は後で実装
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
     * ホスト設定を統一形式に変換（カテゴリ別設定対応）
     * @param hostsConfig ホスト設定
     * @returns 統一形式の設定配列
     */
    public static parseHostsConfig(hostsConfig: Record<string, (string | number)[] | Record<string, (string | number)[]>>): Array<{
        host: string;
        category?: string;
        ports: number[];
    }> {
        const result: Array<{ host: string; category?: string; ports: number[]; }> = [];
        
        for (const [host, config] of Object.entries(hostsConfig)) {
            if (Array.isArray(config)) {
                // 単純配列の場合
                const ports = this.expandPorts(config);
                result.push({ host, ports });
            } else if (typeof config === 'object' && config !== null) {
                // カテゴリ別オブジェクトの場合
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
     * ポート配列を展開（範囲指定やwell-known名を数値に変換）
     * @param ports ポート配列
     * @returns 展開された数値ポート配列
     */
    private static expandPorts(ports: (string | number)[]): number[] {
        const expanded: number[] = [];
        
        for (const port of ports) {
            if (typeof port === 'number') {
                expanded.push(port);
            } else if (typeof port === 'string') {
                // 範囲指定の場合 (例: "3000-3005")
                if (port.includes('-')) {
                    const [start, end] = port.split('-').map(Number);
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let p = start; p <= end; p++) {
                            expanded.push(p);
                        }
                    }
                } else {
                    // well-known名の場合
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
     * well-known名からポート番号を取得
     * @param name well-known名
     * @returns ポート番号
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
