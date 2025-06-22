const tcpPortUsed = require('tcp-port-used');
import { PortInfo } from './config';

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
     * @returns PortInfo
     */
    public async checkPort(host: string, port: number, label: string): Promise<PortInfo> {
        try {
            const isOpen = await tcpPortUsed.check(port, host);
            const portInfo: PortInfo = {
                host,
                port,
                label,
                isOpen
            };

            // For localhost, try to get process information
            if (host === 'localhost' || host === '127.0.0.1') {
                const processInfo = await this.getProcessInfo(port);
                if (processInfo) {
                    portInfo.pid = processInfo.pid;
                    portInfo.processName = processInfo.name;
                }
            }

            return portInfo;
        } catch (error) {
            console.error(`Error checking port ${host}:${port}:`, error);
            return {
                host,
                port,
                label,
                isOpen: false
            };
        }
    }

    /**
     * Check multiple ports
     * @param portConfigs Array of port configurations
     * @returns Array of PortInfo
     */
    public async checkMultiplePorts(portConfigs: Array<{host: string; port: number; label: string}>): Promise<PortInfo[]> {
        const promises = portConfigs.map(config => 
            this.checkPort(config.host, config.port, config.label)
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
        portConfigs: Array<{host: string; port: number; label: string}>,
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
                console.error('Error during port monitoring:', error);
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
        console.log(`Force update requested for monitor ${monitorId}`);
    }

    /**
     * Get process information for a port (localhost only)
     * @param port Port number
     * @returns Process information
     */
    private async getProcessInfo(port: number): Promise<{pid: number, name: string} | null> {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            // Use netstat to find process using the port
            const command = process.platform === 'win32' 
                ? `netstat -ano | findstr :${port}`
                : `lsof -ti:${port}`;

            const { stdout } = await execAsync(command);
            
            if (process.platform === 'win32') {
                // Windows: parse netstat output
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
                        const pid = parseInt(parts[4]);
                        if (!isNaN(pid)) {
                            // Get process name
                            const { stdout: processName } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
                            const name = processName.split(',')[0].replace(/"/g, '');
                            return { pid, name };
                        }
                    }
                }
            } else {
                // Unix-like systems: lsof returns PID directly
                const pid = parseInt(stdout.trim());
                if (!isNaN(pid)) {
                    const { stdout: processName } = await execAsync(`ps -p ${pid} -o comm=`);
                    return { pid, name: processName.trim() };
                }
            }
        } catch (error) {
            // Process info is optional, don't throw error
            console.debug(`Could not get process info for port ${port}:`, error);
        }
        
        return null;
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
