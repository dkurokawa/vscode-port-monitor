import * as vscode from 'vscode';
import { PortInfo } from './config';

/**
 * プロセス管理機能
 * ポートを使用しているプロセスの停止など
 */
export class ProcessManager {
    /**
     * 指定されたポートを使用しているプロセスを停止
     * @param portInfo ポート情報
     * @param confirmBeforeKill 停止前に確認するか
     * @returns 成功したかどうか
     */
    public async killProcess(portInfo: PortInfo, confirmBeforeKill = true): Promise<boolean> {
        // リモートホストでの実行は不可
        if (portInfo.host !== 'localhost' && portInfo.host !== '127.0.0.1') {
            vscode.window.showErrorMessage(`Cannot kill process on remote host: ${portInfo.host}`);
            return false;
        }

        // プロセスが動作していない場合
        if (!portInfo.isOpen || !portInfo.pid) {
            vscode.window.showInformationMessage(`No process found on port ${portInfo.port}`);
            return false;
        }

        // 確認ダイアログ
        if (confirmBeforeKill) {
            const processName = portInfo.processName || 'Unknown';
            const confirm = await vscode.window.showWarningMessage(
                `Kill process "${processName}" (PID: ${portInfo.pid}) on port ${portInfo.port}?`,
                { modal: true },
                'Kill Process'
            );

            if (confirm !== 'Kill Process') {
                return false;
            }
        }

        try {
            const success = await this.terminateProcess(portInfo.pid);
            if (success) {
                const processName = portInfo.processName || 'Process';
                vscode.window.showInformationMessage(
                    `${processName} on port ${portInfo.port} has been terminated`
                );
                return true;
            } else {
                vscode.window.showErrorMessage(
                    `Failed to terminate process on port ${portInfo.port}`
                );
                return false;
            }
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error terminating process: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return false;
        }
    }

    /**
     * 複数のプロセスを選択して停止
     * @param portInfos ポート情報の配列
     * @param confirmBeforeKill 停止前に確認するか
     */
    public async killMultipleProcesses(portInfos: PortInfo[], confirmBeforeKill = true): Promise<void> {
        // 動作中のプロセスのみフィルタ
        const runningProcesses = portInfos.filter(p => p.isOpen && p.pid);
        
        if (runningProcesses.length === 0) {
            vscode.window.showInformationMessage('No running processes found');
            return;
        }

        // プロセス選択UI
        const items = runningProcesses.map(portInfo => ({
            label: `Port ${portInfo.port}`,
            description: `${portInfo.processName || 'Unknown'} (PID: ${portInfo.pid})`,
            portInfo
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select processes to kill',
            canPickMany: true
        });

        if (!selected || selected.length === 0) {
            return;
        }

        // 選択されたプロセスを停止
        const results = await Promise.all(
            selected.map(item => this.killProcess(item.portInfo, confirmBeforeKill))
        );

        const successCount = results.filter(r => r).length;
        const totalCount = selected.length;

        if (successCount === totalCount) {
            vscode.window.showInformationMessage(
                `Successfully terminated ${successCount} process(es)`
            );
        } else {
            vscode.window.showWarningMessage(
                `Terminated ${successCount} out of ${totalCount} process(es)`
            );
        }
    }

    /**
     * プロセス詳細情報を表示
     * @param portInfo ポート情報
     */
    public async showProcessDetails(portInfo: PortInfo): Promise<void> {
        if (!portInfo.isOpen) {
            vscode.window.showInformationMessage(`Port ${portInfo.port} is not in use`);
            return;
        }

        try {
            const details = await this.getDetailedProcessInfo(portInfo.port);
            const message = this.formatProcessDetails(portInfo, details);
            
            vscode.window.showInformationMessage(message, { modal: true });
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to get process details: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * プロセスを実際に終了させる
     * @param pid プロセスID
     * @returns 成功したかどうか
     */
    private async terminateProcess(pid: number): Promise<boolean> {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            let command: string;
            if (process.platform === 'win32') {
                // Windows では taskkill を使用
                command = `taskkill /PID ${pid} /F`;
            } else {
                // Unix系では kill を使用
                command = `kill -TERM ${pid}`;
            }

            await execAsync(command);
            return true;
        } catch (error) {
            console.error(`Failed to terminate process ${pid}:`, error);
            return false;
        }
    }

    /**
     * プロセスの詳細情報を取得
     * @param port ポート番号
     * @returns プロセス詳細情報
     */
    private async getDetailedProcessInfo(port: number): Promise<any> {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            let command: string;
            if (process.platform === 'win32') {
                command = `netstat -ano | findstr :${port} && wmic process where processid="${port}" get Name,ProcessId,CommandLine /format:list`;
            } else {
                command = `lsof -i :${port} -P`;
            }

            const { stdout } = await execAsync(command);
            return this.parseProcessDetails(stdout);
        } catch (error) {
            throw new Error(`Failed to get process details: ${error}`);
        }
    }

    /**
     * プロセス詳細情報をパース
     * @param output コマンド出力
     * @returns パースされた情報
     */
    private parseProcessDetails(output: string): any {
        // プラットフォーム別のパース処理
        // 実装は後で詳細化
        return {
            command: 'N/A',
            startTime: 'N/A',
            cpuUsage: 'N/A',
            memoryUsage: 'N/A'
        };
    }

    /**
     * プロセス詳細情報をフォーマット
     * @param portInfo ポート情報
     * @param details 詳細情報
     * @returns フォーマットされた文字列
     */
    private formatProcessDetails(portInfo: PortInfo, details: any): string {
        const lines = [
            `Process Details - Port ${portInfo.port}`,
            `─────────────────────────────────`,
            `Process Name: ${portInfo.processName || 'Unknown'}`,
            `Process ID: ${portInfo.pid || 'N/A'}`,
            `Host: ${portInfo.host}`,
            `Status: ${portInfo.isOpen ? 'Running' : 'Stopped'}`,
            `Command: ${details.command}`,
            `Start Time: ${details.startTime}`,
            `CPU Usage: ${details.cpuUsage}`,
            `Memory Usage: ${details.memoryUsage}`
        ];

        return lines.join('\n');
    }
}

export default ProcessManager;
