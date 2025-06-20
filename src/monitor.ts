const tcpPortUsed = require('tcp-port-used');
import { PortInfo } from './config';

/**
 * ポート監視機能
 * tcp-port-usedライブラリを使用してポートの使用状況をチェック
 */
export class PortMonitor {
    private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

    /**
     * 単一ポートの状態をチェック
     * @param host ホスト名
     * @param port ポート番号
     * @returns PortInfo
     */
    public async checkPort(host: string, port: number): Promise<PortInfo> {
        try {
            const isOpen = await tcpPortUsed.check(port, host);
            const portInfo: PortInfo = {
                host,
                port,
                isOpen
            };

            // localhost の場合、プロセス情報も取得を試行
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
                isOpen: false
            };
        }
    }

    /**
     * 単一ポートの状態をチェック（カテゴリ情報付き）
     * @param host ホスト名
     * @param port ポート番号
     * @param category カテゴリ名
     * @returns PortInfo
     */
    public async checkPortWithCategory(host: string, port: number, category?: string): Promise<PortInfo> {
        const portInfo = await this.checkPort(host, port);
        if (category) {
            portInfo.category = category;
        }
        return portInfo;
    }

    /**
     * 複数ポートの状態を一括チェック
     * @param host ホスト名
     * @param ports ポート番号の配列
     * @param category カテゴリ名（オプション）
     * @returns PortInfo の配列
     */
    public async checkPorts(host: string, ports: number[], category?: string): Promise<PortInfo[]> {
        const checks = ports.map(port => this.checkPortWithCategory(host, port, category));
        return Promise.all(checks);
    }

    /**
     * 全ホストの全ポートを一括チェック
     * @param hostPortMap ホストとポートのマップ
     * @returns ホスト別の PortInfo 配列のマップ
     */
    public async checkAllHosts(hostPortMap: Record<string, number[]>): Promise<Record<string, PortInfo[]>> {
        const result: Record<string, PortInfo[]> = {};
        
        const hostChecks = Object.entries(hostPortMap).map(async ([host, ports]) => {
            const portInfos = await this.checkPorts(host, ports);
            result[host] = portInfos;
        });

        await Promise.all(hostChecks);
        return result;
    }

    /**
     * カテゴリ別設定に対応した全ホスト監視
     * @param hostConfigs ConfigManager.parseHostsConfigの結果
     * @returns ホスト別の PortInfo 配列のマップ
     */
    public async checkHostConfigs(hostConfigs: Array<{
        host: string;
        category?: string;
        ports: number[];
    }>): Promise<Record<string, PortInfo[]>> {
        const result: Record<string, PortInfo[]> = {};
        
        const hostGroups = new Map<string, PortInfo[]>();
        
        for (const config of hostConfigs) {
            const portInfos = await this.checkPorts(config.host, config.ports, config.category);
            
            if (!hostGroups.has(config.host)) {
                hostGroups.set(config.host, []);
            }
            hostGroups.get(config.host)!.push(...portInfos);
        }
        
        // Mapを通常のオブジェクトに変換
        for (const [host, portInfos] of hostGroups.entries()) {
            result[host] = portInfos;
        }
        
        return result;
    }

    /**
     * 定期監視を開始
     * @param hostPortMap ホストとポートのマップ
     * @param intervalMs 監視間隔（ミリ秒）
     * @param callback 監視結果のコールバック
     * @returns 監視ID
     */
    public startMonitoring(
        hostPortMap: Record<string, number[]>,
        intervalMs: number,
        callback: (results: Record<string, PortInfo[]>) => void
    ): string {
        const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const monitorFunction = async () => {
            try {
                const results = await this.checkAllHosts(hostPortMap);
                callback(results);
            } catch (error) {
                console.error('Monitoring error:', error);
            }
        };

        // 即座に一度実行
        monitorFunction();

        // 定期実行を設定
        const interval = setInterval(monitorFunction, intervalMs);
        this.monitoringIntervals.set(monitorId, interval);

        return monitorId;
    }

    /**
     * 定期監視を停止
     * @param monitorId 監視ID
     */
    public stopMonitoring(monitorId: string): void {
        const interval = this.monitoringIntervals.get(monitorId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(monitorId);
        }
    }

    /**
     * 全ての監視を停止
     */
    public stopAllMonitoring(): void {
        for (const [id, interval] of this.monitoringIntervals) {
            clearInterval(interval);
        }
        this.monitoringIntervals.clear();
    }

    /**
     * ポートを使用しているプロセス情報を取得（localhost のみ）
     * @param port ポート番号
     * @returns プロセス情報
     */
    private async getProcessInfo(port: number): Promise<{ pid: number, name: string } | null> {
        try {
            // Node.js の child_process を使用して lsof コマンドを実行
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            let command: string;
            if (process.platform === 'win32') {
                // Windows の場合は netstat を使用
                command = `netstat -ano | findstr :${port}`;
            } else {
                // Unix系の場合は lsof を使用
                command = `lsof -ti:${port}`;
            }

            const { stdout } = await execAsync(command);
            
            if (process.platform === 'win32') {
                // Windows の netstat 出力をパース
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
                        const pid = parseInt(parts[4], 10);
                        if (!isNaN(pid)) {
                            const processName = await this.getProcessName(pid);
                            return { pid, name: processName || 'Unknown' };
                        }
                    }
                }
            } else {
                // Unix系の lsof 出力をパース
                const pid = parseInt(stdout.trim().split('\n')[0], 10);
                if (!isNaN(pid)) {
                    const processName = await this.getProcessName(pid);
                    return { pid, name: processName || 'Unknown' };
                }
            }

            return null;
        } catch (error) {
            // プロセス情報の取得に失敗してもポート監視は継続
            return null;
        }
    }

    /**
     * PIDからプロセス名を取得
     * @param pid プロセスID
     * @returns プロセス名
     */
    private async getProcessName(pid: number): Promise<string | null> {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            let command: string;
            if (process.platform === 'win32') {
                command = `tasklist /FI "PID eq ${pid}" /FO CSV`;
            } else {
                command = `ps -p ${pid} -o comm=`;
            }

            const { stdout } = await execAsync(command);
            
            if (process.platform === 'win32') {
                const lines = stdout.trim().split('\n');
                if (lines.length > 1) {
                    const processInfo = lines[1].split(',');
                    return processInfo[0].replace(/"/g, '');
                }
            } else {
                return stdout.trim();
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * カテゴリ別設定に対応した定期監視を開始
     * @param hostConfigs ホスト設定配列
     * @param intervalMs 監視間隔（ミリ秒）
     * @param callback 監視結果のコールバック
     * @returns 監視ID
     */
    public startMonitoringWithConfigs(
        hostConfigs: Array<{
            host: string;
            category?: string;
            ports: number[];
        }>,
        intervalMs: number,
        callback: (results: Record<string, PortInfo[]>) => void
    ): string {
        const monitorId = `monitor_${Date.now()}_${Math.random()}`;
        
        const monitorFunction = async () => {
            try {
                const results = await this.checkHostConfigs(hostConfigs);
                callback(results);
            } catch (error) {
                console.error('Port monitoring error:', error);
            }
        };

        // 初回実行
        monitorFunction();

        // 定期実行を設定
        const interval = setInterval(monitorFunction, intervalMs);
        this.monitoringIntervals.set(monitorId, interval);

        return monitorId;
    }
}

export default PortMonitor;
