import { PatternMatcher } from './patternMatcher';
import { PortRange } from './portRange';

/**
 * Label resolver class
 * Resolves labels from port numbers and generates display names
 */
export class LabelResolver {
    private labelPatterns: Record<string, string>;

    constructor(labelPatterns: Record<string, string> = {}) {
        this.labelPatterns = labelPatterns;
    }

    /**
     * Resolve label from port number
     * @param port Port number
     * @returns Label (undefined if not found)
     */
    public resolveLabel(port: number): string | undefined {
        const patterns = Object.keys(this.labelPatterns);
        const matchedPattern = PatternMatcher.findBestMatch(patterns, port);
        return matchedPattern ? this.labelPatterns[matchedPattern] : undefined;
    }

    /**
     * Generate display name from port number
     * @param port Port number
     * @param label Configured label (optional)
     * @param showPortNumber Whether to show port number
     * @param useWellKnownNames Whether to use well-known names
     * @returns Display name
     */
    public getDisplayName(
        port: number,
        label?: string,
        showPortNumber: boolean = true,
        useWellKnownNames: boolean = true
    ): string {
        // If explicit label is configured
        if (label) {
            return showPortNumber ? `${label}:${port}` : label;
        }

        // Resolve label through pattern matching
        const resolvedLabel = this.resolveLabel(port);
        if (resolvedLabel) {
            return showPortNumber ? `${resolvedLabel}:${port}` : resolvedLabel;
        }

        // Use well-known names if enabled
        if (useWellKnownNames) {
            const wellKnownName = PortRange.getPortName(port);
            if (wellKnownName) {
                // Well-known names are always displayed with port number
                return `${wellKnownName}:${port}`;
            }
        }

        // Default is port number only
        return port.toString();
    }

    /**
     * Generate short display name from port number (for status bar)
     * @param port Port number
     * @param label Configured label (optional)
     * @param showFullPortNumber Whether to show full port number
     * @returns Short display name
     */
    public getShortDisplayName(
        port: number,
        label?: string,
        showFullPortNumber: boolean = false
    ): string {
        // If explicit label is configured
        if (label) {
            return showFullPortNumber ? `${label}:${port}` : label;
        }

        // Resolve label through pattern matching
        const resolvedLabel = this.resolveLabel(port);
        if (resolvedLabel) {
            return showFullPortNumber ? `${resolvedLabel}:${port}` : resolvedLabel;
        }

        // Check well-known names
        const wellKnownName = PortRange.getPortName(port);
        if (wellKnownName) {
            // Well-known names are always displayed with port number
            return `${wellKnownName}:${port}`;
        }

        // Default is port number (can be shortened)
        return showFullPortNumber ? port.toString() : port.toString().slice(-1);
    }

    /**
     * Update label configuration
     * @param labelConfig New label configuration
     */
    public updateLabels(labelConfig: Record<string, string>): void {
        this.labelPatterns = labelConfig;
    }

    /**
     * Get current label configuration
     * @returns Label configuration
     */
    public getLabels(): Record<string, string> {
        return { ...this.labelPatterns };
    }

    /**
     * Get pattern set for specific port (for debugging)
     * @param port Port number
     * @returns Matched pattern and label
     */
    public getMatchInfo(port: number): { pattern?: string, label?: string } {
        const patterns = Object.keys(this.labelPatterns);
        const matchedPattern = PatternMatcher.findBestMatch(patterns, port);
        
        return {
            pattern: matchedPattern,
            label: matchedPattern ? this.labelPatterns[matchedPattern] : undefined
        };
    }

    /**
     * Generate host-specific port display (port name/number pair support)
     * @param host Host name
     * @param portInfos Port information array
     * @param statusIcons Status icon settings
     * @param displayOptions Display options
     * @returns Display string
     */
    public generateHostDisplay(
        host: string, 
        portInfos: { port: number; isOpen: boolean; category?: string; label?: string }[], 
        statusIcons: { inUse: string, free: string },
        displayOptions: { separator: string; showFullPortNumber: boolean; compactRanges?: boolean; }
    ): string {
        if (portInfos.length === 0) return '';

        // Create port name/number pairs
        const portPairs = portInfos.map(portInfo => ({
            port: portInfo.port,
            isOpen: portInfo.isOpen,
            displayName: this.getPortDisplayName(portInfo),
            category: portInfo.category,
            label: portInfo.label
        }));

        // Sort by port number
        portPairs.sort((a, b) => a.port - b.port);

        // Group by category (if categories exist)
        if (portInfos.some(p => p.category)) {
            // generateCategoryGroupedDisplay requires compactRanges
            return this.generateCategoryGroupedDisplay(host, portInfos, statusIcons, {
                separator: displayOptions.separator,
                showFullPortNumber: displayOptions.showFullPortNumber,
                compactRanges: displayOptions.compactRanges ?? false
            });
        }

        // Detect common prefix
        const commonPrefix = this.getCommonPortPrefixForAll(portPairs);
        if (commonPrefix && commonPrefix.length >= 2 && (displayOptions.compactRanges ?? false)) {
            // generateCompactHostDisplay doesn't need compactRanges
            return this.generateCompactHostDisplay(host, portPairs, commonPrefix, statusIcons, {
                separator: displayOptions.separator
            });
        } else {
            // generateSimpleHostDisplay doesn't need compactRanges
            return this.generateSimpleHostDisplay(host, portPairs, statusIcons, {
                separator: displayOptions.separator,
                showFullPortNumber: displayOptions.showFullPortNumber
            });
        }
    }

    /**
     * Get port display name (label priority, otherwise well-known name)
     */
    private getPortDisplayName(portInfo: { port: number; label?: string; category?: string }): string {
        // If explicit label is configured
        if (portInfo.label) {
            return portInfo.label;
        }

        // Resolve label through pattern matching
        const resolvedLabel = this.resolveLabel(portInfo.port);
        if (resolvedLabel) {
            return resolvedLabel;
        }

        // Check well-known names
        const wellKnownName = PortRange.getPortName(portInfo.port);
        if (wellKnownName) {
            return wellKnownName;
        }

        // Default is empty string (number-only display)
        return '';
    }

    /**
     * Generate compact display (using common prefix)
     */
    private generateCompactHostDisplay(
        host: string,
        portPairs: { port: number; isOpen: boolean; displayName: string }[],
        commonPrefix: string,
        statusIcons: { inUse: string, free: string },
        displayOptions: { separator: string }
    ): string {
        const portDisplays = portPairs.map(pair => {
            const icon = pair.isOpen ? statusIcons.inUse : statusIcons.free;
            const suffix = pair.port.toString().slice(commonPrefix.length);
            
            if (pair.displayName) {
                return `${icon}${pair.displayName}:${suffix}`;
            } else {
                return `${icon}:${suffix}`;
            }
        });

        return `${host}:${commonPrefix}[${portDisplays.join(displayOptions.separator)}]`;
    }

    /**
     * Generate simple display (without prefix)
     */
    private generateSimpleHostDisplay(
        host: string,
        portPairs: { port: number; isOpen: boolean; displayName: string }[],
        statusIcons: { inUse: string, free: string },
        displayOptions: { separator: string; showFullPortNumber: boolean }
    ): string {
        const portDisplays = portPairs.map(pair => {
            const icon = pair.isOpen ? statusIcons.inUse : statusIcons.free;
            
            if (pair.displayName) {
                // well-known names are always displayed with port number
                const wellKnownName = PortRange.getPortName(pair.port);
                if (wellKnownName) {
                    return `${icon}${pair.displayName}:${pair.port}`;
                }
                
                const portSuffix = displayOptions.showFullPortNumber 
                    ? `:${pair.port}` 
                    : '';
                return `${icon}${pair.displayName}${portSuffix}`;
            } else {
                return `${icon}${pair.port}`;
            }
        });

        return `${host}:[${portDisplays.join(displayOptions.separator)}]`;
    }

    /**
     * Generate category group display
     */
    private generateCategoryGroupedDisplay(
        host: string, 
        portInfos: { port: number; isOpen: boolean; category?: string; label?: string }[], 
        statusIcons: { inUse: string, free: string },
        displayOptions: { separator: string; showFullPortNumber: boolean; compactRanges: boolean }
    ): string {
        // Group by category
        const categoryGroups = this.groupPortsByCategory(portInfos);
        
        const categoryDisplays: string[] = [];
        
        for (const [category, ports] of categoryGroups.entries()) {
            const categoryDisplay = this.generateCategoryDisplay(
                category, 
                ports, 
                statusIcons, 
                displayOptions
            );
            categoryDisplays.push(categoryDisplay);
        }
        
        return `${host}[${categoryDisplays.join(' ')}]`;
    }

    /**
     * Group ports by category
     */
    private groupPortsByCategory(portInfos: { port: number; isOpen: boolean; category?: string; label?: string }[]): Map<string, { port: number; isOpen: boolean; label?: string }[]> {
        const groups = new Map<string, { port: number; isOpen: boolean; label?: string }[]>();
        
        for (const portInfo of portInfos) {
            // Determine category or label
            const groupKey = portInfo.category || this.resolveLabel(portInfo.port) || 'Other';
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push({
                port: portInfo.port,
                isOpen: portInfo.isOpen,
                label: portInfo.label
            });
        }
        
        return groups;
    }

    /**
     * Generate port display within category (label and number mix support)
     */
    private generateCategoryDisplay(
        category: string, 
        ports: { port: number; isOpen: boolean; label?: string }[], 
        statusIcons: { inUse: string, free: string },
        displayOptions: { separator: string; showFullPortNumber: boolean; compactRanges: boolean }
    ): string {
        if (ports.length === 0) return '';

        // Sort by port number
        ports.sort((a, b) => a.port - b.port);

        // Create port name/number pairs
        const portPairs = ports.map(port => ({
            port: port.port,
            isOpen: port.isOpen,
            displayName: this.getPortDisplayName(port)
        }));

        // Detect common prefix
        const commonPrefix = this.getCommonPortPrefixForAll(portPairs);
        
        if (commonPrefix && commonPrefix.length >= 2 && displayOptions.compactRanges) {
            // Display when common part exists
            const portDisplays = portPairs.map(pair => {
            const icon = pair.isOpen ? statusIcons.inUse : statusIcons.free;
                const suffix = pair.port.toString().slice(commonPrefix.length);
                
                if (pair.displayName) {
                    return `${icon}${pair.displayName}:${suffix}`;
                } else {
                    return `${icon}:${suffix}`;
                }
            });
            
            return `${category}:${commonPrefix}[${portDisplays.join(displayOptions.separator)}]`;
        } else {
            // Normal display
            const portDisplays = portPairs.map(pair => {
                const icon = pair.isOpen ? statusIcons.inUse : statusIcons.free;
                
                if (pair.displayName) {
                    // well-known names are always displayed with port number
                    const wellKnownName = PortRange.getPortName(pair.port);
                    if (wellKnownName) {
                        return `${icon}${pair.displayName}:${pair.port}`;
                    }
                    
                    // If label exists
                    if (displayOptions.showFullPortNumber) {
                        return `${icon}${pair.displayName}:${pair.port}`;
                    } else {
                        return `${icon}${pair.displayName}`;
                    }
                } else {
                    // If no label (number only)
                    return `${icon}${pair.port}`;
                }
            });
            
            return `${category}:[${portDisplays.join(displayOptions.separator)}]`;
        }
    }

    /**
     * Detect common prefix for all ports (port name/number pair support)
     * @param portPairs Port name/number pair array
     * @returns Common prefix (only if 2 or more characters)
     */
    private getCommonPortPrefixForAll(portPairs: { port: number; displayName: string }[]): string | null {
        if (portPairs.length <= 1) return null;

        const portStrings = portPairs.map(pair => pair.port.toString());
        let commonPrefix = portStrings[0];

        // Find longest common prefix
        for (let i = 1; i < portStrings.length; i++) {
            const current = portStrings[i];
            let j = 0;
            while (j < commonPrefix.length && j < current.length && commonPrefix[j] === current[j]) {
                j++;
            }
            commonPrefix = commonPrefix.substring(0, j);
            
            if (commonPrefix.length < 2) {
                return null; // Common part less than 2 is meaningless
            }
        }

        // Get the longest possible common prefix
        // Example: [3000, 3001, 3007, 3008, 3009] → "300" (maximum common part)
        return commonPrefix.length >= 2 ? commonPrefix : null;
    }
}
