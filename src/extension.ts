import * as vscode from 'vscode';
import { ConfigManager, PortInfo, PortMonitorConfig } from './config';
import { PortRange } from './portRange';
import { LabelResolver } from './labelResolver';
import { PortMonitor } from './monitor';
import { ProcessManager } from './processManager';
import { LogViewer } from './logViewer';

export class PortMonitorExtension {
    private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
    private monitor: PortMonitor;
    private configManager: ConfigManager;
    private labelResolver: LabelResolver;
    private processManager: ProcessManager;
    private logViewer: LogViewer;
    private currentMonitorId?: string;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.monitor = new PortMonitor();
        this.configManager = ConfigManager.getInstance();
        this.labelResolver = new LabelResolver({});
        this.processManager = new ProcessManager();
        this.logViewer = new LogViewer(context);
        
        this.initialize();
    }

    private initialize(): void {
        // 設定変更の監視
        const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('portMonitor')) {
                this.onConfigurationChanged();
            }
        });
        this.disposables.push(configChangeDisposable);

        // コマンドの登録
        this.registerCommands();

        // 初期設定の読み込みと監視開始
        this.onConfigurationChanged();
    }

    private registerCommands(): void {
        const commands = [
            vscode.commands.registerCommand('portMonitor.refresh', () => this.refreshPortStatus()),
            vscode.commands.registerCommand('portMonitor.killProcess', (portInfo?: PortInfo) => this.killProcess(portInfo)),
            vscode.commands.registerCommand('portMonitor.showLog', (portInfo?: PortInfo) => this.showProcessLog(portInfo)),
            vscode.commands.registerCommand('portMonitor.openSettings', () => this.openSettings())
        ];

        this.disposables.push(...commands);
    }

    private onConfigurationChanged(): void {
        this.configManager.refresh();
        const config = this.configManager.getConfig();

        // 設定の検証
        const errors = this.configManager.validateConfig(config);
        if (errors.length > 0) {
            vscode.window.showErrorMessage(`Port Monitor configuration errors: ${errors.join(', ')}`);
            return;
        }

        // ラベルリゾルバーの更新
        this.labelResolver.updateLabels(config.portLabels);

        // 監視の再開始
        this.restartMonitoring();
    }

    private restartMonitoring(): void {
        // 既存の監視を停止
        if (this.currentMonitorId) {
            this.monitor.stopMonitoring(this.currentMonitorId);
        }

        const config = this.configManager.getConfig();
        
        // カテゴリ別設定を解析
        const hostConfigs = ConfigManager.parseHostsConfig(config.hosts);

        if (hostConfigs.length === 0) {
            this.clearStatusBar();
            return;
        }

        // 新しい監視を開始（カテゴリ対応）
        this.currentMonitorId = this.monitor.startMonitoringWithConfigs(
            hostConfigs,
            config.intervalMs,
            (results) => this.updateStatusBar(results, config)
        );
    }

    private updateStatusBar(results: Record<string, PortInfo[]>, config: PortMonitorConfig): void {
        // 既存のステータスバーアイテムをクリア
        this.clearStatusBar();

        for (const [host, portInfos] of Object.entries(results)) {
            if (portInfos.length === 0) continue;

            // 設定に基づいて位置を決定
            const alignment = config.displayOptions.statusBarPosition === 'left' 
                ? vscode.StatusBarAlignment.Left 
                : vscode.StatusBarAlignment.Right;
            const priority = config.displayOptions.statusBarPriority;
            
            const statusBarItem = vscode.window.createStatusBarItem(alignment, priority);
            
            // ポート情報にラベルを追加
            const enrichedPortInfos = portInfos.map(p => ({
                port: p.port,
                isOpen: p.isOpen,
                category: p.category,
                label: p.label || this.labelResolver.resolveLabel(p.port)
            }));

            // 新しい表示形式を使用
            let displayText = this.labelResolver.generateHostDisplay(
                host,
                enrichedPortInfos,
                config.statusIcons,
                config.displayOptions
            );

            // 表示文字列が長すぎる場合は省略
            const maxLength = config.displayOptions.maxDisplayLength || 100;
            if (displayText.length > maxLength) {
                displayText = displayText.substring(0, maxLength - 3) + '...';
            }

            statusBarItem.text = displayText;
            statusBarItem.tooltip = this.generateTooltip(host, portInfos);
            statusBarItem.command = {
                command: 'portMonitor.showMenu',
                title: 'Show Port Monitor Menu',
                arguments: [host, portInfos]
            };

            statusBarItem.show();
            this.statusBarItems.set(host, statusBarItem);
        }
    }

    private generateDisplayText(
        host: string, 
        portInfos: PortInfo[], 
        portDisplays: string[], 
        config: PortMonitorConfig
    ): string {
        const separator = config.displayOptions.separator;
        const showFullPortNumber = config.displayOptions.showFullPortNumber;
        const compactRanges = config.displayOptions.compactRanges;

        // 区切り文字でポートを結合
        const portsText = portDisplays.join(separator);

        // 範囲圧縮が有効で、完全ポート番号表示でない場合、共通プレフィックスを計算
        if (compactRanges && !showFullPortNumber && portInfos.length > 1) {
            const commonPrefix = this.getCommonPrefix(portInfos.map(p => p.port.toString()));
            if (commonPrefix) {
                return `${host}: ${commonPrefix}[${portsText}]`;
            }
        }

        // デフォルト表示
        return `${host}: [${portsText}]`;
    }

    private generateTooltip(host: string, portInfos: PortInfo[]): string {
        const lines = [`Port Monitor - ${host}`];
        
        for (const portInfo of portInfos) {
            const status = portInfo.isOpen ? 'Open' : 'Closed';
            const label = this.labelResolver.resolveLabel(portInfo.port);
            const labelText = label ? ` (${label})` : '';
            const processText = portInfo.processName ? ` - ${portInfo.processName}` : '';
            
            lines.push(`  Port ${portInfo.port}${labelText}: ${status}${processText}`);
        }

        return lines.join('\n');
    }

    private getCommonPrefix(strings: string[]): string {
        if (strings.length === 0) return '';
        if (strings.length === 1) return '';

        let prefix = strings[0];
        for (let i = 1; i < strings.length; i++) {
            while (strings[i].indexOf(prefix) !== 0) {
                prefix = prefix.substring(0, prefix.length - 1);
                if (prefix === '') return '';
            }
        }

        // 意味のあるプレフィックスのみ返す（最低2文字）
        return prefix.length >= 2 ? prefix : '';
    }

    private clearStatusBar(): void {
        for (const statusBarItem of this.statusBarItems.values()) {
            statusBarItem.dispose();
        }
        this.statusBarItems.clear();
    }

    private async refreshPortStatus(): Promise<void> {
        // 手動更新の場合は即座に監視を実行
        this.restartMonitoring();
        vscode.window.showInformationMessage('Port status refreshed');
    }

    private async killProcess(portInfo?: PortInfo): Promise<void> {
        if (!portInfo) {
            // ポート情報が指定されていない場合は、選択UI を表示
            const config = this.configManager.getConfig();
            const allPortInfos: PortInfo[] = [];
            
            // 現在監視中のポート情報を取得
            const hostConfigs = ConfigManager.parseHostsConfig(config.hosts);
            
            const results = await this.monitor.checkHostConfigs(hostConfigs);
            for (const portInfos of Object.values(results)) {
                allPortInfos.push(...portInfos.filter(p => p.isOpen));
            }
            
            if (allPortInfos.length === 0) {
                vscode.window.showInformationMessage('No running processes found');
                return;
            }
            
            await this.processManager.killMultipleProcesses(allPortInfos, config.confirmBeforeKill);
        } else {
            const config = this.configManager.getConfig();
            await this.processManager.killProcess(portInfo, config.confirmBeforeKill);
        }
    }

    private async showProcessLog(portInfo?: PortInfo): Promise<void> {
        if (!portInfo) {
            vscode.window.showInformationMessage('Please select a specific port to view logs');
            return;
        }

        const config = this.configManager.getConfig();
        await this.logViewer.showProcessLog(portInfo, {
            logBufferSize: config.logBufferSize,
            autoScrollLog: config.autoScrollLog
        });
    }

    private openSettings(): void {
        vscode.commands.executeCommand('workbench.action.openSettings', 'portMonitor');
    }

    public dispose(): void {
        // 監視停止
        if (this.currentMonitorId) {
            this.monitor.stopMonitoring(this.currentMonitorId);
        }

        // ステータスバーアイテムの削除
        this.clearStatusBar();

        // ログビューアの削除
        this.logViewer.dispose();

        // Disposableの削除
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

// 拡張機能のエントリーポイント
export function activate(context: vscode.ExtensionContext) {
    console.log('Port Monitor extension is now active');
    
    const extension = new PortMonitorExtension(context);
    context.subscriptions.push({
        dispose: () => extension.dispose()
    });
}

export function deactivate() {
    console.log('Port Monitor extension is now deactivated');
}
