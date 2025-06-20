// Well-known port definitions
const WELL_KNOWN_PORTS: Record<string, number> = {
    'http': 80,
    'https': 443,
    'ssh': 22,
    'ftp': 21,
    'telnet': 23,
    'smtp': 25,
    'dns': 53,
    'dhcp': 67,
    'tftp': 69,
    'pop3': 110,
    'imap': 143,
    'snmp': 161,
    'ldap': 389,
    'smtps': 465,
    'imaps': 993,
    'pop3s': 995,
    'mysql': 3306,
    'postgresql': 5432,
    'redis': 6379,
    'mongodb': 27017
};

export class PortRange {
    /**
     * ポート指定（数値、範囲、well-known名）を実際のポート番号の配列に展開
     * @param portSpec ポート指定（例: 3000, "3000-3005", "http"）
     * @returns ポート番号の配列
     */
    public static resolve(portSpec: string | number): number[] {
        if (typeof portSpec === 'number') {
            return this.validatePort(portSpec) ? [portSpec] : [];
        }

        const spec = portSpec.toString().trim();

        // Well-known port name
        if (WELL_KNOWN_PORTS[spec.toLowerCase()]) {
            return [WELL_KNOWN_PORTS[spec.toLowerCase()]];
        }

        // Range specification (e.g., "3000-3005")
        if (spec.includes('-')) {
            return this.parseRange(spec);
        }

        // Single port as string (e.g., "3000")
        const port = parseInt(spec, 10);
        if (!isNaN(port) && this.validatePort(port)) {
            return [port];
        }

        return [];
    }

    /**
     * 複数のポート指定を展開して、総ポート数を制限チェック
     * @param portSpecs ポート指定の配列
     * @param maxPorts 最大ポート数（デフォルト: 100）
     * @returns 展開されたポート番号の配列
     */
    public static resolveMultiple(portSpecs: (string | number)[], maxPorts = 100): number[] {
        const allPorts: number[] = [];
        const seenPorts = new Set<number>();

        for (const spec of portSpecs) {
            const ports = this.resolve(spec);
            for (const port of ports) {
                if (!seenPorts.has(port)) {
                    seenPorts.add(port);
                    allPorts.push(port);
                    
                    if (allPorts.length >= maxPorts) {
                        console.warn(`Port limit reached (${maxPorts}). Some ports may be ignored.`);
                        return allPorts;
                    }
                }
            }
        }

        return allPorts.sort((a, b) => a - b);
    }

    /**
     * ポート範囲指定を解析（例: "3000-3005" → [3000, 3001, 3002, 3003, 3004, 3005]）
     */
    private static parseRange(rangeSpec: string): number[] {
        const parts = rangeSpec.split('-');
        if (parts.length !== 2) {
            return [];
        }

        const start = parseInt(parts[0].trim(), 10);
        const end = parseInt(parts[1].trim(), 10);

        if (isNaN(start) || isNaN(end) || start > end) {
            return [];
        }

        if (!this.validatePort(start) || !this.validatePort(end)) {
            return [];
        }

        const ports: number[] = [];
        for (let port = start; port <= end; port++) {
            ports.push(port);
        }

        return ports;
    }

    /**
     * ポート番号の妥当性検証
     */
    private static validatePort(port: number): boolean {
        return Number.isInteger(port) && port >= 1 && port <= 65535;
    }

    /**
     * Well-known ポート名の一覧を取得
     */
    public static getWellKnownPorts(): Record<string, number> {
        return { ...WELL_KNOWN_PORTS };
    }

    /**
     * ポート番号からwell-known名を逆引き
     */
    public static getPortName(port: number): string | undefined {
        for (const [name, portNum] of Object.entries(WELL_KNOWN_PORTS)) {
            if (portNum === port) {
                return name;
            }
        }
        return undefined;
    }
}
