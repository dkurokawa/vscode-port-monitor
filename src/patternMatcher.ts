/**
 * Globパターンマッチング機能
 * PortMonitorでのポートラベル設定用
 */
export class PatternMatcher {
    /**
     * Globパターンでポート番号をマッチング
     * @param pattern Globパターン（例: "300*", "*443", "30?0"）
     * @param port ポート番号
     * @returns マッチするかどうか
     */
    public static match(pattern: string, port: number): boolean {
        const portStr = port.toString();
        
        // 完全一致
        if (pattern === portStr) {
            return true;
        }

        // Globパターンマッチング
        const regex = this.globToRegex(pattern);
        return regex.test(portStr);
    }

    /**
     * 複数のパターンから最も具体的なマッチを見つける
     * @param patterns パターンの配列（優先度順）
     * @param port ポート番号
     * @returns マッチしたパターン、または undefined
     */
    public static findBestMatch(patterns: string[], port: number): string | undefined {
        const portStr = port.toString();
        
        // 完全一致を最優先
        if (patterns.includes(portStr)) {
            return portStr;
        }

        // 具体性でソート（ワイルドカードが少ない順）
        const sortedPatterns = patterns
            .filter(p => p !== portStr) // 完全一致は除外
            .sort((a, b) => this.getSpecificity(a) - this.getSpecificity(b));

        // 最初にマッチしたパターンを返す
        for (const pattern of sortedPatterns) {
            if (this.match(pattern, port)) {
                return pattern;
            }
        }

        return undefined;
    }

    /**
     * Globパターンを正規表現に変換
     * @param pattern Globパターン
     * @returns 正規表現
     */
    private static globToRegex(pattern: string): RegExp {
        let regex = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 正規表現の特殊文字をエスケープ
            .replace(/\*/g, '.*')                 // * を .* に変換
            .replace(/\?/g, '.');                 // ? を . に変換

        return new RegExp(`^${regex}$`);
    }

    /**
     * パターンの具体性を計算（数値が小さいほど具体的）
     * @param pattern Globパターン
     * @returns 具体性スコア
     */
    private static getSpecificity(pattern: string): number {
        let score = 0;
        
        // ワイルドカードが多いほどスコアが高い（具体性が低い）
        const wildcards = (pattern.match(/[*?]/g) || []).length;
        score += wildcards * 10;
        
        // 全体がワイルドカード（*）の場合は最低優先度
        if (pattern === '*') {
            score += 1000;
        }
        
        // パターンが短いほど具体性が低い
        score += (10 - pattern.length);
        
        return score;
    }

    /**
     * パターンがワイルドカードを含むかチェック
     * @param pattern パターン文字列
     * @returns ワイルドカードを含むかどうか
     */
    public static hasWildcard(pattern: string): boolean {
        return /[*?]/.test(pattern);
    }

    /**
     * パターンマッチングのテスト用ユーティリティ
     * @param patterns パターンとポートのテストケース
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
