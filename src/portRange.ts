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
     * Expand port specification (number, range, well-known name) to an array of actual port numbers
     * @param portSpec Port specification (e.g., 3000, "3000-3005", "http")
     * @returns Array of port numbers
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
     * Expand multiple port specifications and check total port count limit
     * @param portSpecs Array of port specifications
     * @param maxPorts Maximum number of ports (default: 100)
     * @returns Array of expanded port numbers
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
     * Parse port range specification (e.g., "3000-3005" → [3000, 3001, 3002, 3003, 3004, 3005])
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
     * Validate port number
     */
    private static validatePort(port: number): boolean {
        return Number.isInteger(port) && port >= 1 && port <= 65535;
    }

    /**
     * Get list of well-known port names
     */
    public static getWellKnownPorts(): Record<string, number> {
        return { ...WELL_KNOWN_PORTS };
    }

    /**
     * Reverse lookup well-known name from port number
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
