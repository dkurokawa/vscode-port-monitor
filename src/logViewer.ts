import * as vscode from 'vscode';
import { PortInfo } from './config';

/**
 * プロセスログ表示機能
 * プロセスのstdout/stderrをリアルタイムで表示
 */
export class LogViewer {
    private logPanels: Map<string, vscode.WebviewPanel> = new Map();
    private logProcesses: Map<string, any> = new Map(); // child_process objects

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * プロセスのログを表示
     * @param portInfo ポート情報
     * @param config ログ設定
     */
    public async showProcessLog(
        portInfo: PortInfo, 
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): Promise<void> {
        // リモートホストは対応しない
        if (portInfo.host !== 'localhost' && portInfo.host !== '127.0.0.1') {
            vscode.window.showErrorMessage(`Cannot view logs for remote host: ${portInfo.host}`);
            return;
        }

        // プロセスが動作していない場合
        if (!portInfo.isOpen || !portInfo.pid) {
            vscode.window.showInformationMessage(`No process found on port ${portInfo.port}`);
            return;
        }

        const panelKey = `${portInfo.host}:${portInfo.port}`;
        
        // 既存のパネルがある場合は前面に表示
        const existingPanel = this.logPanels.get(panelKey);
        if (existingPanel) {
            existingPanel.reveal();
            return;
        }

        // 新しいWebviewパネルを作成
        const panel = vscode.window.createWebviewPanel(
            'portMonitorLog',
            `Log: ${portInfo.processName || 'Process'} (Port ${portInfo.port})`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // パネルを記録
        this.logPanels.set(panelKey, panel);

        // パネルが閉じられた時の処理
        panel.onDidDispose(() => {
            this.stopLogCapture(panelKey);
            this.logPanels.delete(panelKey);
        });

        // HTML コンテンツを設定
        panel.webview.html = this.getLogViewerHtml(portInfo, config);

        // ログキャプチャを開始
        await this.startLogCapture(panelKey, portInfo, panel, config);
    }

    /**
     * ログキャプチャを開始
     * @param panelKey パネルキー
     * @param portInfo ポート情報
     * @param panel Webviewパネル
     * @param config ログ設定
     */
    private async startLogCapture(
        panelKey: string, 
        portInfo: PortInfo, 
        panel: vscode.WebviewPanel,
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): Promise<void> {
        try {
            // プロセスの出力をキャプチャ
            const logProcess = await this.attachToProcess(portInfo.pid!);
            this.logProcesses.set(panelKey, logProcess);

            if (logProcess) {
                // stdout を監視
                logProcess.stdout?.on('data', (data: Buffer) => {
                    this.sendLogToPanel(panel, 'stdout', data.toString(), config.autoScrollLog);
                });

                // stderr を監視
                logProcess.stderr?.on('data', (data: Buffer) => {
                    this.sendLogToPanel(panel, 'stderr', data.toString(), config.autoScrollLog);
                });

                // プロセス終了時
                logProcess.on('exit', (code: number) => {
                    this.sendLogToPanel(panel, 'system', `Process exited with code ${code}`, config.autoScrollLog);
                });
            } else {
                // プロセスにアタッチできない場合は、ファイルベースのログ監視を試行
                this.sendLogToPanel(panel, 'system', 'Direct process attachment not available. Monitoring log files...', config.autoScrollLog);
                await this.startFileBasedLogMonitoring(panelKey, portInfo, panel, config);
            }
        } catch (error) {
            this.sendLogToPanel(panel, 'error', `Failed to start log capture: ${error}`, config.autoScrollLog);
        }
    }

    /**
     * プロセスにアタッチ（実際の実装では制限があるため、代替手段を使用）
     * @param pid プロセスID
     * @returns プロセスオブジェクト
     */
    private async attachToProcess(pid: number): Promise<any> {
        // 注意: 既存のプロセスの stdout/stderr を直接キャプチャするのは困難
        // 代替として、strace や dtrace を使用するか、ログファイル監視を実装
        
        // 簡易実装として、プロセス監視のみ
        try {
            const { spawn } = require('child_process');
            
            let command: string;
            let args: string[];
            
            if (process.platform === 'win32') {
                // Windows では PowerShell を使用してプロセス監視
                command = 'powershell';
                args = ['-Command', `Get-Process -Id ${pid} | Format-Table -AutoSize`];
            } else {
                // Unix系では ps を使用
                command = 'ps';
                args = ['-p', pid.toString(), '-o', 'pid,ppid,cmd'];
            }

            const childProcess = spawn(command, args);
            return childProcess;
        } catch (error) {
            console.error('Failed to attach to process:', error);
            return null;
        }
    }

    /**
     * ファイルベースのログ監視を開始
     * @param panelKey パネルキー
     * @param portInfo ポート情報
     * @param panel Webviewパネル
     * @param config ログ設定
     */
    private async startFileBasedLogMonitoring(
        panelKey: string,
        portInfo: PortInfo,
        panel: vscode.WebviewPanel,
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): Promise<void> {
        // 一般的なログファイルの場所を監視
        const logPaths = this.getCommonLogPaths(portInfo);
        
        for (const logPath of logPaths) {
            try {
                const fs = require('fs');
                if (fs.existsSync(logPath)) {
                    this.sendLogToPanel(panel, 'system', `Monitoring log file: ${logPath}`, config.autoScrollLog);
                    
                    // ファイル変更を監視
                    const watcher = fs.watchFile(logPath, (curr: any, prev: any) => {
                        if (curr.mtime > prev.mtime) {
                            // ファイルが更新された場合、新しい内容を読み取り
                            this.readLogFileUpdates(logPath, panel, config);
                        }
                    });
                    
                    // 初期内容を読み込み
                    this.readLogFileInitial(logPath, panel, config);
                    break;
                }
            } catch (error) {
                console.error(`Failed to monitor log file ${logPath}:`, error);
            }
        }
    }

    /**
     * 一般的なログファイルパスを取得
     * @param portInfo ポート情報
     * @returns ログファイルパスの配列
     */
    private getCommonLogPaths(portInfo: PortInfo): string[] {
        const paths: string[] = [];
        const port = portInfo.port;
        
        if (process.platform === 'win32') {
            // Windows の一般的なログパス
            paths.push(
                `C:\\logs\\app_${port}.log`,
                `C:\\temp\\${port}.log`,
                `${process.env.USERPROFILE}\\AppData\\Local\\Temp\\${port}.log`
            );
        } else {
            // Unix系の一般的なログパス
            paths.push(
                `/var/log/app_${port}.log`,
                `/tmp/${port}.log`,
                `${process.env.HOME}/.local/share/logs/${port}.log`,
                `./logs/${port}.log`,
                `./${port}.log`
            );
        }
        
        return paths;
    }

    /**
     * ログファイルの初期内容を読み込み
     * @param logPath ログファイルパス
     * @param panel Webviewパネル
     * @param config ログ設定
     */
    private readLogFileInitial(
        logPath: string, 
        panel: vscode.WebviewPanel, 
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): void {
        try {
            const fs = require('fs');
            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').slice(-config.logBufferSize);
            
            for (const line of lines) {
                if (line.trim()) {
                    this.sendLogToPanel(panel, 'file', line, false);
                }
            }
            
            if (config.autoScrollLog) {
                this.sendScrollCommand(panel);
            }
        } catch (error) {
            console.error('Failed to read initial log file:', error);
        }
    }

    /**
     * ログファイルの更新を読み込み
     * @param logPath ログファイルパス
     * @param panel Webviewパネル
     * @param config ログ設定
     */
    private readLogFileUpdates(
        logPath: string, 
        panel: vscode.WebviewPanel, 
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): void {
        // 実装は簡略化 - 実際にはファイルの最後から新しい行のみ読み取り
        this.readLogFileInitial(logPath, panel, config);
    }

    /**
     * パネルにログメッセージを送信
     * @param panel Webviewパネル
     * @param type ログタイプ
     * @param message メッセージ
     * @param autoScroll 自動スクロールするか
     */
    private sendLogToPanel(panel: vscode.WebviewPanel, type: string, message: string, autoScroll: boolean): void {
        panel.webview.postMessage({
            type: 'log',
            logType: type,
            message: message,
            timestamp: new Date().toISOString(),
            autoScroll: autoScroll
        });
    }

    /**
     * パネルにスクロールコマンドを送信
     * @param panel Webviewパネル
     */
    private sendScrollCommand(panel: vscode.WebviewPanel): void {
        panel.webview.postMessage({
            type: 'scroll'
        });
    }

    /**
     * ログキャプチャを停止
     * @param panelKey パネルキー
     */
    private stopLogCapture(panelKey: string): void {
        const childProcess = this.logProcesses.get(panelKey);
        if (childProcess) {
            try {
                childProcess.kill();
            } catch (error) {
                console.error('Failed to kill log process:', error);
            }
            this.logProcesses.delete(panelKey);
        }
    }

    /**
     * ログビューアのHTMLを生成
     * @param portInfo ポート情報
     * @param config ログ設定
     * @returns HTML文字列
     */
    private getLogViewerHtml(portInfo: PortInfo, config: { logBufferSize: number, autoScrollLog: boolean }): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Log Viewer - Port ${portInfo.port}</title>
            <style>
                body {
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    margin: 0;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-size: 12px;
                    line-height: 1.4;
                }
                .header {
                    background-color: var(--vscode-titleBar-activeBackground);
                    padding: 8px;
                    margin: -10px -10px 10px -10px;
                    border-bottom: 1px solid var(--vscode-titleBar-border);
                }
                .log-container {
                    height: calc(100vh - 80px);
                    overflow-y: auto;
                    border: 1px solid var(--vscode-panel-border);
                    padding: 5px;
                    background-color: var(--vscode-terminal-background);
                }
                .log-entry {
                    margin: 2px 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .log-stdout { color: var(--vscode-terminal-foreground); }
                .log-stderr { color: var(--vscode-errorForeground); }
                .log-system { color: var(--vscode-terminal-ansiBlue); }
                .log-error { color: var(--vscode-errorForeground); font-weight: bold; }
                .log-file { color: var(--vscode-terminal-ansiGreen); }
                .timestamp {
                    color: var(--vscode-descriptionForeground);
                    font-size: 10px;
                    margin-right: 8px;
                }
                .controls {
                    position: fixed;
                    top: 50px;
                    right: 10px;
                    z-index: 1000;
                }
                .control-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    margin-left: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }
                .control-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <strong>Process Log - ${portInfo.processName || 'Unknown'} (Port ${portInfo.port})</strong>
                <div style="font-size: 11px; margin-top: 4px;">
                    PID: ${portInfo.pid} | Host: ${portInfo.host} | Buffer: ${config.logBufferSize} lines
                </div>
            </div>
            
            <div class="controls">
                <button class="control-button" onclick="clearLog()">Clear</button>
                <button class="control-button" onclick="toggleAutoScroll()">${config.autoScrollLog ? 'Disable' : 'Enable'} Auto-scroll</button>
                <button class="control-button" onclick="scrollToBottom()">Scroll to Bottom</button>
            </div>
            
            <div class="log-container" id="logContainer">
                <div class="log-entry log-system">
                    <span class="timestamp">${new Date().toISOString()}</span>
                    Starting log capture for port ${portInfo.port}...
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let autoScroll = ${config.autoScrollLog};
                let logBuffer = [];
                const maxBufferSize = ${config.logBufferSize};

                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.type === 'log') {
                        addLogEntry(message.logType, message.message, message.timestamp);
                        if (message.autoScroll || autoScroll) {
                            scrollToBottom();
                        }
                    } else if (message.type === 'scroll') {
                        scrollToBottom();
                    }
                });

                function addLogEntry(logType, message, timestamp) {
                    const container = document.getElementById('logContainer');
                    const entry = document.createElement('div');
                    entry.className = 'log-entry log-' + logType;
                    
                    const time = new Date(timestamp).toLocaleTimeString();
                    entry.innerHTML = '<span class="timestamp">' + time + '</span>' + escapeHtml(message);
                    
                    container.appendChild(entry);
                    
                    // バッファサイズを超えた場合、古いエントリを削除
                    logBuffer.push(entry);
                    if (logBuffer.length > maxBufferSize) {
                        const oldEntry = logBuffer.shift();
                        if (oldEntry && oldEntry.parentNode) {
                            oldEntry.parentNode.removeChild(oldEntry);
                        }
                    }
                }

                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }

                function clearLog() {
                    const container = document.getElementById('logContainer');
                    container.innerHTML = '';
                    logBuffer = [];
                }

                function toggleAutoScroll() {
                    autoScroll = !autoScroll;
                    const button = event.target;
                    button.textContent = autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll';
                }

                function scrollToBottom() {
                    const container = document.getElementById('logContainer');
                    container.scrollTop = container.scrollHeight;
                }
            </script>
        </body>
        </html>
        `;
    }

    /**
     * 全てのログビューアを閉じる
     */
    public dispose(): void {
        for (const [key, panel] of this.logPanels) {
            panel.dispose();
            this.stopLogCapture(key);
        }
        this.logPanels.clear();
        this.logProcesses.clear();
    }
}

export default LogViewer;
