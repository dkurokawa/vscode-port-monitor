import * as net from 'net';
import { PortInfo, GroupConfigs, ProcessInfo } from './config';

/**
 * Simple port monitoring functionality
 */
export class PortMonitor {
    private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Check single port status
     * @param host Host name
     * @param port Port number
     * @param label Port label
     * @param group Group name
     * @param groupConfigs Group configuration
     * @returns PortInfo
     */
    public async checkPort(host: string, port: number, label: string, group: string, groupConfigs?: GroupConfigs): Promise<PortInfo> {
        try {
            const isOpen = await this.isPortOpen(host, port);
            const portInfo: PortInfo = {
                host,
                port,
                label,
                group,
                groupConfigs,
                isOpen
            };

            // For localhost, try to get process information
            if (host === 'localhost' || host === '127.0.0.1') {
                const processInfos = await this.getProcessInfos(port);
                if (processInfos && processInfos.length > 0) {
                    portInfo.processes = processInfos;
                    
                    // Select the best process (server first, then fallback to first)
                    const serverProcess = processInfos.find(p => p.isServer);
                    const selectedProcess = serverProcess || processInfos[0];
                    
                    portInfo.pid = selectedProcess.pid;
                    portInfo.processName = selectedProcess.name;
                }
            }

            return portInfo;
        } catch (error) {
            return {
                host,
                port,
                label,
                group,
                groupConfigs,
                isOpen: false
            };
        }
    }

    /**
     * Check multiple ports
     * @param portConfigs Array of port configurations
     * @returns Array of PortInfo
     */
    public async checkMultiplePorts(portConfigs: Array<{host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs}>): Promise<PortInfo[]> {
        const promises = portConfigs.map(config => 
            this.checkPort(config.host, config.port, config.label, config.group, config.groupConfigs)
        );
        return Promise.all(promises);
    }

    /**
     * Start monitoring ports
     * @param portConfigs Port configurations to monitor
     * @param intervalMs Monitoring interval in milliseconds
     * @param callback Callback function called when status changes
     * @returns Monitoring ID
     */
    public async startMonitoring(
        portConfigs: Array<{host: string; port: number; label: string; group: string; groupConfigs?: GroupConfigs}>,
        intervalMs: number,
        callback: (results: PortInfo[]) => void
    ): Promise<string> {
        const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Initial check
        const initialResults = await this.checkMultiplePorts(portConfigs);
        callback(initialResults);

        // Set up periodic monitoring
        const interval = setInterval(async () => {
            try {
                const results = await this.checkMultiplePorts(portConfigs);
                callback(results);
            } catch (error) {
            }
        }, intervalMs);

        this.monitoringIntervals.set(monitorId, interval);
        return monitorId;
    }

    /**
     * Stop monitoring
     * @param monitorId Monitoring ID to stop
     */
    public stopMonitoring(monitorId: string): void {
        const interval = this.monitoringIntervals.get(monitorId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(monitorId);
        }
    }

    /**
     * Force update for a monitoring session
     * @param monitorId Monitoring ID
     */
    public async forceUpdate(monitorId: string): Promise<void> {
        // In this simplified version, force update is just a trigger for the next check
        // The actual update will happen in the next interval cycle
    }

    /**
     * Get process information for a port (localhost only)
     * @param port Port number
     * @returns Process information
     */
    private async getProcessInfos(port: number): Promise<ProcessInfo[] | null> {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            const processes: ProcessInfo[] = [];

            if (process.platform === 'win32') {
                // Windows: use netstat to find processes
                const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                const lines = stdout.trim().split('\n');
                
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
                        const pid = parseInt(parts[4]);
                        if (!isNaN(pid)) {
                            try {
                                // Get process name and command
                                const { stdout: processInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
                                const name = processInfo.split(',')[0].replace(/"/g, '');
                                
                                // Get command line
                                const { stdout: cmdInfo } = await execAsync(`wmic process where "ProcessId=${pid}" get CommandLine /value`);
                                const command = cmdInfo.split('CommandLine=')[1]?.split('\n')[0]?.trim();
                                
                                const isServer = this.isServerProcess(name, command);
                                processes.push({ pid, name, command, isServer });
                            } catch (cmdError) {
                                // If detailed info fails, still add basic info
                                processes.push({ pid, name: `PID ${pid}`, isServer: false });
                            }
                        }
                    }
                }
            } else {
                // Unix-like systems: use lsof to find processes
                const { stdout } = await execAsync(`lsof -ti:${port}`);
                const pids = stdout.trim().split('\n').filter((p: string) => p.trim());
                
                for (const pidStr of pids) {
                    const pid = parseInt(pidStr.trim());
                    if (!isNaN(pid)) {
                        try {
                            // Get process name
                            const { stdout: processName } = await execAsync(`ps -p ${pid} -o comm=`);
                            const name = processName.trim();
                            
                            // Get command line
                            const { stdout: cmdLine } = await execAsync(`ps -p ${pid} -o args=`);
                            const command = cmdLine.trim();
                            
                            const isServer = this.isServerProcess(name, command);
                            processes.push({ pid, name, command, isServer });
                        } catch (psError) {
                            // If detailed info fails, still add basic info
                            processes.push({ pid, name: `PID ${pid}`, isServer: false });
                        }
                    }
                }
            }

            return processes.length > 0 ? processes : null;
        } catch (error) {
            // Process info is optional, don't throw error
        }
        
        return null;
    }

    /**
     * Determine if a process is likely a server process
     * @param processName Process name
     * @param command Command line
     * @returns True if likely a server process
     */
    private isServerProcess(processName: string, command?: string): boolean {
        if (!processName) return false;
        
        const lowerName = processName.toLowerCase();
        const lowerCommand = command?.toLowerCase() || '';
        
        // Server process indicators
        const serverKeywords = [
            'server', 'daemon', 'service', 'node', 'python', 'java',
            'nginx', 'apache', 'httpd', 'gunicorn', 'uvicorn', 'fastapi',
            'express', 'koa', 'rails', 'django', 'flask', 'tomcat',
            'php-fpm', 'puma', 'unicorn', 'passenger', 'mongod', 'mysql',
            'postgres', 'redis', 'elasticsearch', 'docker', 'containerd'
        ];
        
        // Browser process indicators (should be deprioritized)
        const browserKeywords = [
            'chrome', 'firefox', 'safari', 'edge', 'browser', 'chromium',
            'opera', 'vivaldi', 'brave'
        ];
        
        // Check if it's a browser process
        if (browserKeywords.some(keyword => lowerName.includes(keyword) || lowerCommand.includes(keyword))) {
            return false;
        }
        
        // Check if it's a server process
        return serverKeywords.some(keyword => lowerName.includes(keyword) || lowerCommand.includes(keyword));
    }

    /**
     * Check if a port is open using native Node.js net module
     * @param host Host to check
     * @param port Port to check
     * @returns Promise<boolean> true if port is open
     */
    private async isPortOpen(host: string, port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 1000; // 1 second timeout

            socket.setTimeout(timeout);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });

            socket.connect(port, host);
        });
    }

    /**
     * Dispose all monitoring sessions
     */
    public dispose(): void {
        for (const interval of this.monitoringIntervals.values()) {
            clearInterval(interval);
        }
        this.monitoringIntervals.clear();
    }
}
