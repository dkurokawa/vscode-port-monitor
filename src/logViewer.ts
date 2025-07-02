import * as vscode from 'vscode';
import { PortInfo } from './config';

/**
 * Process log display functionality
 * Display process stdout/stderr in real-time
 */
export class LogViewer {
    private logPanels: Map<string, vscode.WebviewPanel> = new Map();
    private logProcesses: Map<string, any> = new Map(); // child_process objects

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Display process logs
     * @param portInfo Port information
     * @param config Log configuration
     */
    public async showProcessLog(
        portInfo: PortInfo, 
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): Promise<void> {
        // Remote hosts are not supported
        if (portInfo.host !== 'localhost' && portInfo.host !== '127.0.0.1') {
            vscode.window.showErrorMessage(`Cannot view logs for remote host: ${portInfo.host}`);
            return;
        }

        // When process is not running
        if (!portInfo.isOpen || !portInfo.pid) {
            vscode.window.showInformationMessage(`No process found on port ${portInfo.port}`);
            return;
        }

        const panelKey = `${portInfo.host}:${portInfo.port}`;
        
        // If existing panel exists, bring it to front
        const existingPanel = this.logPanels.get(panelKey);
        if (existingPanel) {
            existingPanel.reveal();
            return;
        }

        // Create new Webview panel
        const panel = vscode.window.createWebviewPanel(
            'portMonitorLog',
            `Log: ${portInfo.processName || 'Process'} (Port ${portInfo.port})`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Record the panel
        this.logPanels.set(panelKey, panel);

        // Handler for when panel is closed
        panel.onDidDispose(() => {
            this.stopLogCapture(panelKey);
            this.logPanels.delete(panelKey);
        });

        // Set HTML content
        panel.webview.html = this.getLogViewerHtml(portInfo, config);

        // Start log capture
        await this.startLogCapture(panelKey, portInfo, panel, config);
    }

    /**
     * Start log capture
     * @param panelKey Panel key
     * @param portInfo Port information
     * @param panel Webview panel
     * @param config Log configuration
     */
    private async startLogCapture(
        panelKey: string, 
        portInfo: PortInfo, 
        panel: vscode.WebviewPanel,
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): Promise<void> {
        try {
            // Capture process output
            const logProcess = await this.attachToProcess(portInfo.pid!);
            this.logProcesses.set(panelKey, logProcess);

            if (logProcess) {
                // Monitor stdout
                logProcess.stdout?.on('data', (data: Buffer) => {
                    this.sendLogToPanel(panel, 'stdout', data.toString(), config.autoScrollLog);
                });

                // Monitor stderr
                logProcess.stderr?.on('data', (data: Buffer) => {
                    this.sendLogToPanel(panel, 'stderr', data.toString(), config.autoScrollLog);
                });

                // When process exits
                logProcess.on('exit', (code: number) => {
                    this.sendLogToPanel(panel, 'system', `Process exited with code ${code}`, config.autoScrollLog);
                });
            } else {
                // If cannot attach to process, try file-based log monitoring
                this.sendLogToPanel(panel, 'system', 'Direct process attachment not available. Monitoring log files...', config.autoScrollLog);
                await this.startFileBasedLogMonitoring(panelKey, portInfo, panel, config);
            }
        } catch (error) {
            this.sendLogToPanel(panel, 'error', `Failed to start log capture: ${error}`, config.autoScrollLog);
        }
    }

    /**
     * Attach to process (uses alternative methods due to limitations in actual implementation)
     * @param pid Process ID
     * @returns Process object
     */
    private async attachToProcess(pid: number): Promise<any> {
        // Note: Direct capture of existing process stdout/stderr is difficult
        // Alternatively, use strace or dtrace, or implement log file monitoring
        
        // Simple implementation - process monitoring only
        try {
            const { spawn } = require('child_process');
            
            let command: string;
            let args: string[];
            
            if (process.platform === 'win32') {
                // Use PowerShell for process monitoring on Windows
                command = 'powershell';
                args = ['-Command', `Get-Process -Id ${pid} | Format-Table -AutoSize`];
            } else {
                // Use ps on Unix-like systems
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
     * Start file-based log monitoring
     * @param panelKey Panel key
     * @param portInfo Port information
     * @param panel Webview panel
     * @param config Log configuration
     */
    private async startFileBasedLogMonitoring(
        panelKey: string,
        portInfo: PortInfo,
        panel: vscode.WebviewPanel,
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): Promise<void> {
        // Monitor common log file locations
        const logPaths = this.getCommonLogPaths(portInfo);
        
        for (const logPath of logPaths) {
            try {
                const fs = require('fs');
                if (fs.existsSync(logPath)) {
                    this.sendLogToPanel(panel, 'system', `Monitoring log file: ${logPath}`, config.autoScrollLog);
                    
                    // Monitor file changes
                    const watcher = fs.watchFile(logPath, (curr: any, prev: any) => {
                        if (curr.mtime > prev.mtime) {
                            // If file was updated, read new content
                            this.readLogFileUpdates(logPath, panel, config);
                        }
                    });
                    
                    // Read initial content
                    this.readLogFileInitial(logPath, panel, config);
                    break;
                }
            } catch (error) {
                console.error(`Failed to monitor log file ${logPath}:`, error);
            }
        }
    }

    /**
     * Get common log file paths
     * @param portInfo Port information
     * @returns Array of log file paths
     */
    private getCommonLogPaths(portInfo: PortInfo): string[] {
        const paths: string[] = [];
        const port = portInfo.port;
        
        if (process.platform === 'win32') {
            // Common log paths on Windows
            paths.push(
                `C:\\logs\\app_${port}.log`,
                `C:\\temp\\${port}.log`,
                `${process.env.USERPROFILE}\\AppData\\Local\\Temp\\${port}.log`
            );
        } else {
            // Common log paths on Unix-like systems
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
     * Read initial content of log file
     * @param logPath Log file path
     * @param panel Webview panel
     * @param config Log configuration
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
     * Read log file updates
     * @param logPath Log file path
     * @param panel Webview panel
     * @param config Log configuration
     */
    private readLogFileUpdates(
        logPath: string, 
        panel: vscode.WebviewPanel, 
        config: { logBufferSize: number, autoScrollLog: boolean }
    ): void {
        // Implementation is simplified - actually should read only new lines from end of file
        this.readLogFileInitial(logPath, panel, config);
    }

    /**
     * Send log message to panel
     * @param panel Webview panel
     * @param type Log type
     * @param message Message
     * @param autoScroll Whether to auto scroll
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
     * Send scroll command to panel
     * @param panel Webview panel
     */
    private sendScrollCommand(panel: vscode.WebviewPanel): void {
        panel.webview.postMessage({
            type: 'scroll'
        });
    }

    /**
     * Stop log capture
     * @param panelKey Panel key
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
     * Generate HTML for log viewer
     * @param portInfo Port information
     * @param config Log configuration
     * @returns HTML string
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

                // Add event listener for messages from extension
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
                    
                    // If buffer size exceeded, remove old entries
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
     * Close all log viewers
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
