import { PatternMatcher } from './patternMatcher';
import { PortRange } from './portRange';

/**
 * ラベル解決クラス
 * ポート番号からラベルを解決し、表示名を生成する
 */
export class LabelResolver {
    private labelPatterns: Record<string, string>;

    constructor(labelPatterns: Record<string, string> = {}) {
        this.labelPatterns = labelPatterns;
    }

    /**
     * ポート番号からラベルを解決
     * @param port ポート番号
     * @returns ラベル（見つからない場合はundefined）
     */
    public resolveLabel(port: number): string | undefined {
        const patterns = Object.keys(this.labelPatterns);
        const matchedPattern = PatternMatcher.findBestMatch(patterns, port);
        return matchedPattern ? this.labelPatterns[matchedPattern] : undefined;
    }

    /**
     * ポート番号から表示名を生成
     * @param port ポート番号
     * @param label 設定されたラベル（オプション）
     * @param showPortNumber ポート番号を表示するか
     * @param useWellKnownNames well-known名を使用するか
     * @returns 表示名
     */
    public getDisplayName(
        port: number,
        label?: string,
        showPortNumber: boolean = true,
        useWellKnownNames: boolean = true
    ): string {
        // 明示的なラベルが設定されている場合
        if (label) {
            return showPortNumber ? `${label}:${port}` : label;
        }

        // パターンマッチングでラベルを解決
        const resolvedLabel = this.resolveLabel(port);
        if (resolvedLabel) {
            return showPortNumber ? `${resolvedLabel}:${port}` : resolvedLabel;
        }

        // well-known名を使用する場合
        if (useWellKnownNames) {
            const wellKnownName = PortRange.getPortName(port);
            if (wellKnownName) {
                // well-known名は常にポート番号付きで表示
                return `${wellKnownName}:${port}`;
            }
        }

        // デフォルトはポート番号のみ
        return port.toString();
    }

    /**
     * ポート番号から短縮表示名を生成（ステータスバー用）
     * @param port ポート番号
     * @param label 設定されたラベル（オプション）
     * @param showFullPortNumber 完全なポート番号を表示するか
     * @returns 短縮表示名
     */
    public getShortDisplayName(
        port: number,
        label?: string,
        showFullPortNumber: boolean = false
    ): string {
        // 明示的なラベルが設定されている場合
        if (label) {
            return showFullPortNumber ? `${label}:${port}` : label;
        }

        // パターンマッチングでラベルを解決
        const resolvedLabel = this.resolveLabel(port);
        if (resolvedLabel) {
            return showFullPortNumber ? `${resolvedLabel}:${port}` : resolvedLabel;
        }

        // well-known名をチェック
        const wellKnownName = PortRange.getPortName(port);
        if (wellKnownName) {
            // well-known名は常にポート番号付きで表示
            return `${wellKnownName}:${port}`;
        }

        // デフォルトはポート番号（短縮可能）
        return showFullPortNumber ? port.toString() : port.toString().slice(-1);
    }

    /**
     * ラベル設定を更新
     * @param labelConfig 新しいラベル設定
     */
    public updateLabels(labelConfig: Record<string, string>): void {
        this.labelPatterns = labelConfig;
    }

    /**
     * 現在のラベル設定を取得
     * @returns ラベル設定
     */
    public getLabels(): Record<string, string> {
        return { ...this.labelPatterns };
    }

    /**
     * 特定のポートに設定されたパターンを取得（デバッグ用）
     * @param port ポート番号
     * @returns マッチしたパターンとラベル
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
     * ホスト別のポート表示を生成（ポート名・番号ペア対応）
     * @param host ホスト名
     * @param portInfos ポート情報配列
     * @param statusIcons ステータスアイコン設定
     * @param displayOptions 表示オプション
     * @returns 表示文字列
     */
    public generateHostDisplay(
        host: string, 
        portInfos: { port: number; isOpen: boolean; category?: string; label?: string }[], 
        statusIcons: { open: string, closed: string },
        displayOptions: { separator: string; showFullPortNumber: boolean; compactRanges: boolean }
    ): string {
        if (portInfos.length === 0) return '';

        // ポート名・番号ペアを作成
        const portPairs = portInfos.map(portInfo => ({
            port: portInfo.port,
            isOpen: portInfo.isOpen,
            displayName: this.getPortDisplayName(portInfo),
            category: portInfo.category,
            label: portInfo.label
        }));

        // ポート番号でソート
        portPairs.sort((a, b) => a.port - b.port);

        // カテゴリ別にグループ化（カテゴリがある場合）
        if (portInfos.some(p => p.category)) {
            return this.generateCategoryGroupedDisplay(host, portInfos, statusIcons, displayOptions);
        }

        // 共通プレフィックスを検出
        const commonPrefix = this.getCommonPortPrefixForAll(portPairs);
        
        if (commonPrefix && commonPrefix.length >= 2 && displayOptions.compactRanges) {
            return this.generateCompactHostDisplay(host, portPairs, commonPrefix, statusIcons, displayOptions);
        } else {
            return this.generateSimpleHostDisplay(host, portPairs, statusIcons, displayOptions);
        }
    }

    /**
     * ポートの表示名を取得（ラベル優先、なければwell-known名）
     */
    private getPortDisplayName(portInfo: { port: number; label?: string; category?: string }): string {
        // ラベルが設定されている場合
        if (portInfo.label) {
            return portInfo.label;
        }

        // well-known名をチェック
        const wellKnownName = PortRange.getPortName(portInfo.port);
        if (wellKnownName) {
            return wellKnownName;
        }

        // デフォルトは空文字（番号のみ表示）
        return '';
    }

    /**
     * コンパクト表示生成（共通プレフィックス使用）
     */
    private generateCompactHostDisplay(
        host: string,
        portPairs: { port: number; isOpen: boolean; displayName: string }[],
        commonPrefix: string,
        statusIcons: { open: string, closed: string },
        displayOptions: { separator: string }
    ): string {
        const portDisplays = portPairs.map(pair => {
            const icon = pair.isOpen ? statusIcons.open : statusIcons.closed;
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
     * シンプル表示生成（プレフィックスなし）
     */
    private generateSimpleHostDisplay(
        host: string,
        portPairs: { port: number; isOpen: boolean; displayName: string }[],
        statusIcons: { open: string, closed: string },
        displayOptions: { separator: string; showFullPortNumber: boolean }
    ): string {
        const portDisplays = portPairs.map(pair => {
            const icon = pair.isOpen ? statusIcons.open : statusIcons.closed;
            
            if (pair.displayName) {
                const portSuffix = displayOptions.showFullPortNumber 
                    ? `:${pair.port}` 
                    : '';
                return `${icon}${pair.displayName}${portSuffix}`;
            } else {
                const portStr = displayOptions.showFullPortNumber 
                    ? pair.port.toString()
                    : pair.port.toString().slice(-1);
                return `${icon}${portStr}`;
            }
        });

        return `${host}:[${portDisplays.join(displayOptions.separator)}]`;
    }

    /**
     * カテゴリ別グループ表示生成
     */
    private generateCategoryGroupedDisplay(
        host: string, 
        portInfos: { port: number; isOpen: boolean; category?: string; label?: string }[], 
        statusIcons: { open: string, closed: string },
        displayOptions: { separator: string; showFullPortNumber: boolean; compactRanges: boolean }
    ): string {
        // カテゴリ別にグループ化
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
     * ポートをカテゴリ別にグループ化
     */
    private groupPortsByCategory(portInfos: { port: number; isOpen: boolean; category?: string; label?: string }[]): Map<string, { port: number; isOpen: boolean; label?: string }[]> {
        const groups = new Map<string, { port: number; isOpen: boolean; label?: string }[]>();
        
        for (const portInfo of portInfos) {
            // カテゴリまたはラベルを決定
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
     * カテゴリ内のポート表示を生成（ラベルと番号の混在対応）
     */
    private generateCategoryDisplay(
        category: string, 
        ports: { port: number; isOpen: boolean; label?: string }[], 
        statusIcons: { open: string, closed: string },
        displayOptions: { separator: string; showFullPortNumber: boolean; compactRanges: boolean }
    ): string {
        if (ports.length === 0) return '';

        // ポート番号でソート
        ports.sort((a, b) => a.port - b.port);

        // ポート名・番号ペアを作成
        const portPairs = ports.map(port => ({
            port: port.port,
            isOpen: port.isOpen,
            displayName: this.getPortDisplayName(port)
        }));

        // 共通プレフィックスを検出
        const commonPrefix = this.getCommonPortPrefixForAll(portPairs);
        
        if (commonPrefix && commonPrefix.length >= 2 && displayOptions.compactRanges) {
            // 共通部がある場合の表示
            const portDisplays = portPairs.map(pair => {
                const icon = pair.isOpen ? statusIcons.open : statusIcons.closed;
                const suffix = pair.port.toString().slice(commonPrefix.length);
                
                if (pair.displayName) {
                    return `${icon}${pair.displayName}:${suffix}`;
                } else {
                    return `${icon}:${suffix}`;
                }
            });
            
            return `${category}:${commonPrefix}[${portDisplays.join(displayOptions.separator)}]`;
        } else {
            // 通常表示
            const portDisplays = portPairs.map(pair => {
                const icon = pair.isOpen ? statusIcons.open : statusIcons.closed;
                
                if (pair.displayName) {
                    // ラベルがある場合
                    if (displayOptions.showFullPortNumber) {
                        return `${icon}${pair.displayName}:${pair.port}`;
                    } else {
                        return `${icon}${pair.displayName}`;
                    }
                } else {
                    // ラベルがない場合（番号のみ）
                    return `${icon}${pair.port}`;
                }
            });
            
            return `${category}:[${portDisplays.join(displayOptions.separator)}]`;
        }
    }

    /**
     * 全ポートの共通プレフィックスを検出（ポート名・番号ペア対応）
     * @param portPairs ポート名・番号ペア配列
     * @returns 共通プレフィックス（2文字以上の場合のみ）
     */
    private getCommonPortPrefixForAll(portPairs: { port: number; displayName: string }[]): string | null {
        if (portPairs.length <= 1) return null;

        const portStrings = portPairs.map(pair => pair.port.toString());
        let commonPrefix = portStrings[0];

        for (let i = 1; i < portStrings.length; i++) {
            const current = portStrings[i];
            let j = 0;
            while (j < commonPrefix.length && j < current.length && commonPrefix[j] === current[j]) {
                j++;
            }
            commonPrefix = commonPrefix.substring(0, j);
            
            if (commonPrefix.length < 2) {
                return null; // 共通部が2未満の場合は意味がない
            }
        }

        return commonPrefix.length >= 2 ? commonPrefix : null;
    }
}
