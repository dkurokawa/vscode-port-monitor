/**
 * Glob pattern matching functionality
 * For port label configuration in PortMonitor
 */
export class PatternMatcher {
    /**
     * Match port numbers with glob patterns
     * @param pattern Glob pattern (e.g., "300*", "*443", "30?0")
     * @param port Port number
     * @returns Whether it matches
     */
    public static match(pattern: string, port: number): boolean {
        const portStr = port.toString();
        
        // Exact match
        if (pattern === portStr) {
            return true;
        }

        // Glob pattern matching
        const regex = this.globToRegex(pattern);
        return regex.test(portStr);
    }

    /**
     * Find the most specific match from multiple patterns
     * @param patterns Array of patterns (in priority order)
     * @param port Port number
     * @returns Matched pattern, or undefined
     */
    public static findBestMatch(patterns: string[], port: number): string | undefined {
        const portStr = port.toString();
        
        // Exact match gets highest priority
        if (patterns.includes(portStr)) {
            return portStr;
        }

        // Sort by specificity (fewer wildcards first)
        const sortedPatterns = patterns
            .filter(p => p !== portStr) // Exclude exact matches
            .sort((a, b) => this.getSpecificity(a) - this.getSpecificity(b));

        // Return the first matched pattern
        for (const pattern of sortedPatterns) {
            if (this.match(pattern, port)) {
                return pattern;
            }
        }

        return undefined;
    }

    /**
     * Convert glob pattern to regular expression
     * @param pattern Glob pattern
     * @returns Regular expression
     */
    private static globToRegex(pattern: string): RegExp {
        let regex = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
            .replace(/\*/g, '.*')                 // Convert * to .*
            .replace(/\?/g, '.');                 // Convert ? to .

        return new RegExp(`^${regex}$`);
    }

    /**
     * Calculate pattern specificity (smaller numbers are more specific)
     * @param pattern Glob pattern
     * @returns Specificity score
     */
    private static getSpecificity(pattern: string): number {
        let score = 0;
        
        // More wildcards = higher score (less specific)
        const wildcards = (pattern.match(/[*?]/g) || []).length;
        score += wildcards * 10;
        
        // If entire pattern is wildcard (*), give lowest priority
        if (pattern === '*') {
            score += 1000;
        }
        
        // Shorter patterns are less specific
        score += (10 - pattern.length);
        
        return score;
    }

    /**
     * Check if pattern contains wildcards
     * @param pattern Pattern string
     * @returns Whether it contains wildcards
     */
    public static hasWildcard(pattern: string): boolean {
        return /[*?]/.test(pattern);
    }

    /**
     * Utility for testing pattern matching
     * @param patterns Test cases of patterns and ports
     */
    public static test(patterns: Array<{ pattern: string, port: number, expected: boolean }>): void {
        console.log('Pattern Matching Test Results:');
        
        for (const { pattern, port, expected } of patterns) {
            const result = this.match(pattern, port);
            const status = result === expected ? '✅' : '❌';
            console.log(`${status} "${pattern}" vs ${port} => ${result} (expected: ${expected})`);
        }
    }
}
