import * as vscode from 'vscode';
import { PortInfo } from './config';

/**
 * Process management functionality
 * Manages stopping processes that are using ports
 */
export class ProcessManager {
    /**
     * Stop the process using the specified port
     * @param portInfo Port information
     * @param confirmBeforeKill Whether to confirm before stopping
     * @returns Whether the operation was successful
     */
    public async killProcess(portInfo: PortInfo, confirmBeforeKill = true): Promise<boolean> {
        // Cannot execute on remote hosts
        if (portInfo.host !== 'localhost' && portInfo.host !== '127.0.0.1') {
            vscode.window.showErrorMessage(`Cannot kill process on remote host: ${portInfo.host}`);
            return false;
        }

        // When process is not running
        if (!portInfo.isOpen || !portInfo.pid) {
            vscode.window.showInformationMessage(`No process found on port ${portInfo.port}`);
            return false;
        }

        // Confirmation dialog
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
     * Select and stop multiple processes
     * @param portInfos Array of port information
     * @param confirmBeforeKill Whether to confirm before stopping
     */
    public async killMultipleProcesses(portInfos: PortInfo[], confirmBeforeKill = true): Promise<void> {
        // Filter only running processes
        const runningProcesses = portInfos.filter(p => p.isOpen && p.pid);
        
        if (runningProcesses.length === 0) {
            vscode.window.showInformationMessage('No running processes found');
            return;
        }

        // Process selection UI
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

        // Stop selected processes
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
     * Display detailed process information
     * @param portInfo Port information
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
     * Actually terminate the process
     * @param pid Process ID
     * @returns Whether the operation was successful
     */
    private async terminateProcess(pid: number): Promise<boolean> {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            let command: string;
            if (process.platform === 'win32') {
                // Use taskkill on Windows
                command = `taskkill /PID ${pid} /F`;
            } else {
                // Use kill on Unix-like systems
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
     * Get detailed process information
     * @param port Port number
     * @returns Detailed process information
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
     * Parse process detailed information
     * @param output Command output
     * @returns Parsed information
     */
    private parseProcessDetails(output: string): any {
        // Platform-specific parsing process
        // Implementation will be detailed later
        return {
            command: 'N/A',
            startTime: 'N/A',
            cpuUsage: 'N/A',
            memoryUsage: 'N/A'
        };
    }

    /**
     * Format process detailed information
     * @param portInfo Port information
     * @param details Detailed information
     * @returns Formatted string
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
