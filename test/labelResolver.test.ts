/**
 * LabelResolver テストケース - 表示パターン検証
 * 様々なポート構成での期待される動作を明確化
 */

// Mock modules for testing (VS Code環境を模擬)
const mockPatternMatcher = {
    findBestMatch: jest.fn()
};

const mockPortRange = {
    getPortName: jest.fn()
};

// Mock the imports
jest.mock('../src/patternMatcher', () => ({
    PatternMatcher: mockPatternMatcher
}));

jest.mock('../src/portRange', () => ({
    PortRange: mockPortRange
}));

import { LabelResolver } from '../src/labelResolver';

describe('🧪 LabelResolver 表示ロジック テスト', () => {
    let resolver: LabelResolver;
    
    const statusIcons = { open: '🟢', closed: '🔴' };
    const displayOptions = { 
        separator: '|', 
        showFullPortNumber: false, 
        compactRanges: true 
    };

    beforeEach(() => {
        // Mock functions reset
        jest.clearAllMocks();
        
        // Setup mock behaviors
        mockPatternMatcher.findBestMatch.mockImplementation((patterns: string[], port: number) => {
            const labelMap: Record<string, string> = {
                '3000': 'main',
                '3001': 'dev',
                '8080': 'api',
                '9000': 'admin'
            };
            return patterns.find(pattern => pattern === port.toString());
        });

        // Setup well-known port names
        mockPortRange.getPortName.mockImplementation((port: number) => {
            const wellKnownPorts: Record<number, string> = {
                22: 'ssh',
                80: 'http',
                443: 'https',
                5432: 'postgresql',
                3306: 'mysql'
            };
            return wellKnownPorts[port];
        });

        resolver = new LabelResolver({
            '3000': 'main',
            '3001': 'dev',
            '8080': 'api',
            '9000': 'admin'
        });
    });

    describe('📊 共通プレフィックステスト', () => {
        test('✅ 3文字共通: [3000,3001,3007,3008,3009] → 300[0|1|7|8|9]', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3007, isOpen: false },
                { port: 3008, isOpen: false },
                { port: 3009, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]');
        });

        test('✅ 2文字共通: [3000,3001,3100] → 3[000|001|100]', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3100, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost:3[🟢main:000|🟢dev:001|🔴:100]');
        });

        test('❌ 共通なし: [3000,4000,8080] → 通常表示', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 4000, isOpen: false },
                { port: 8080, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost:[🟢main|🔴4000|🟢api]');
        });
    });

    describe('🏷️ ラベル表示テスト', () => {
        test('✅ ラベル付きポートの表示', () => {
            const ports = [
                { port: 3000, isOpen: true },   // main
                { port: 3001, isOpen: true },   // dev  
                { port: 3002, isOpen: false },  // ラベルなし
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost:300[🟢main:0|🟢dev:1|🔴:2]');
        });

        test('🌐 well-knownポート名の表示', () => {
            const ports = [
                { port: 22, isOpen: false },
                { port: 80, isOpen: true },
                { port: 443, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost:[🔴ssh:22|🟢http:80|🟢https:443]');
        });
    });

    describe('📁 カテゴリ表示テスト', () => {
        test('🏗️ カテゴリ別グループ化', () => {
            const ports = [
                { port: 3000, isOpen: true, category: 'Next.js' },
                { port: 3001, isOpen: true, category: 'Next.js' },
                { port: 80, isOpen: true, category: 'Web' },
                { port: 443, isOpen: false, category: 'Web' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost[Next.js:[🟢main|🟢dev] Web:[🟢http:80|🔴https:443]]');
        });

        test('📦 カテゴリ内共通プレフィックス', () => {
            const ports = [
                { port: 3000, isOpen: true, category: 'Next.js' },
                { port: 3001, isOpen: true, category: 'Next.js' },
                { port: 3007, isOpen: false, category: 'Next.js' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7]]');
        });
    });

    describe('⚙️ 表示オプションテスト', () => {
        test('🔢 showFullPortNumber=true', () => {
            const fullOptions = { ...displayOptions, showFullPortNumber: true };
            const ports = [
                { port: 3000, isOpen: true },
                { port: 8080, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, fullOptions);
            
            expect(result).toBe('localhost:[🟢main:3000|🔴api:8080]');
        });

        test('📏 compactRanges=false', () => {
            const noCompactOptions = { ...displayOptions, compactRanges: false };
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3007, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, noCompactOptions);
            
            expect(result).toBe('localhost:[🟢main|🟢dev|🔴3007]');
        });
    });

    describe('🚀 実際の使用例', () => {
        test('⚛️ Next.js開発環境', () => {
            const ports = [
                { port: 3000, isOpen: true, category: 'Next.js', label: 'main' },
                { port: 3001, isOpen: true, category: 'Next.js', label: 'dev' },
                { port: 3007, isOpen: false, category: 'Next.js' },
                { port: 3008, isOpen: false, category: 'Next.js' },
                { port: 3009, isOpen: false, category: 'Next.js' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]]');
        });

        test('🏗️ マイクロサービス環境', () => {
            const ports = [
                { port: 8080, isOpen: true, category: 'API' },
                { port: 8081, isOpen: true, category: 'API' },
                { port: 8082, isOpen: false, category: 'API' },
                { port: 5432, isOpen: true, category: 'Database' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, statusIcons, displayOptions);
            
            expect(result).toBe('localhost[API:808[🟢api:0|🟢:1|🔴:2] Database:[🟢postgresql:5432]]');
        });
    });
});

    describe('共通プレフィックスのテスト', () => {
        test('3文字共通プレフィックス: [3000,3001,3007,3008,3009] → "300"', () => {
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3007, isOpen: false },
                { port: 3008, isOpen: false },
                { port: 3009, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 期待: localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]
            expect(result).toBe('localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]');
        });

        test('2文字共通プレフィックス: [3000,3001,3100] → "3"', () => {
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3100, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 期待: localhost:3[🟢main:000|🟢dev:001|🔴:100]
            expect(result).toBe('localhost:3[🟢main:000|🟢dev:001|🔴:100]');
        });

        test('共通プレフィックスなし: [3000,4000,8080] → 通常表示', () => {
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 4000, isOpen: false },
                { port: 8080, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 期待: localhost:[🟢main|🔴4000|🟢api]
            expect(result).toBe('localhost:[🟢main|🔴4000|🟢api]');
        });

        test('1文字共通プレフィックス（無効）: [3000,3100,3200] → 通常表示', () => {
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 4000, isOpen: false },
                { port: 5000, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 共通プレフィックスが1文字以下なので通常表示
            expect(result).toBe('localhost:[🟢main|🔴4000|🔴5000]');
        });
    });

    describe('ラベルと番号の混在テスト', () => {
        test('ラベルありとラベルなしのポートが混在', () => {
            const portInfos = [
                { port: 3000, isOpen: true },   // main ラベル
                { port: 3001, isOpen: true },   // dev ラベル
                { port: 3002, isOpen: false },  // ラベルなし
                { port: 3003, isOpen: false }   // ラベルなし
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 期待: localhost:300[🟢main:0|🟢dev:1|🔴:2|🔴:3]
            expect(result).toBe('localhost:300[🟢main:0|🟢dev:1|🔴:2|🔴:3]');
        });

        test('well-known ポート名の表示', () => {
            const portInfos = [
                { port: 80, isOpen: true },    // http
                { port: 443, isOpen: true },   // https
                { port: 22, isOpen: false }    // ssh
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // well-known名は常にポート番号付きで表示
            expect(result).toBe('localhost:[🟢ssh:22|🟢http:80|🟢https:443]');
        });
    });

    describe('カテゴリ別表示のテスト', () => {
        test('カテゴリ別グループ化', () => {
            const portInfos = [
                { port: 3000, isOpen: true, category: 'Next.js' },
                { port: 3001, isOpen: true, category: 'Next.js' },
                { port: 80, isOpen: true, category: 'Web' },
                { port: 443, isOpen: false, category: 'Web' }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 期待: localhost[Next.js:[🟢main|🟢dev] Web:[🟢http:80|🔴https:443]]
            expect(result).toBe('localhost[Next.js:[🟢main|🟢dev] Web:[🟢http:80|🔴https:443]]');
        });

        test('カテゴリ内で共通プレフィックスあり', () => {
            const portInfos = [
                { port: 3000, isOpen: true, category: 'Next.js' },
                { port: 3001, isOpen: true, category: 'Next.js' },
                { port: 3007, isOpen: false, category: 'Next.js' },
                { port: 8080, isOpen: true, category: 'API' }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 期待: localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7] API:[🟢api]]
            expect(result).toBe('localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7] API:[🟢api]]');
        });
    });

    describe('表示オプションのテスト', () => {
        test('showFullPortNumber=true の場合', () => {
            const fullNumberOptions = { ...displayOptions, showFullPortNumber: true };
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 8080, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, fullNumberOptions);
            
            // ラベルありの場合はポート番号も表示
            expect(result).toBe('localhost:[🟢main:3000|🔴api:8080]');
        });

        test('compactRanges=false の場合', () => {
            const noCompactOptions = { ...displayOptions, compactRanges: false };
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3007, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, noCompactOptions);
            
            // 共通プレフィックスを使わず通常表示
            expect(result).toBe('localhost:[🟢main|🟢dev|🔴3007]');
        });

        test('区切り文字の変更', () => {
            const customSeparatorOptions = { ...displayOptions, separator: ' ' };
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, customSeparatorOptions);
            
            expect(result).toBe('localhost:300[🟢main:0 🟢dev:1]');
        });
    });

    describe('エッジケースのテスト', () => {
        test('ポートが1つだけの場合', () => {
            const portInfos = [
                { port: 3000, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            expect(result).toBe('localhost:[🟢main]');
        });

        test('ポートが空の場合', () => {
            const portInfos: any[] = [];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            expect(result).toBe('');
        });

        test('全ポートが同じ番号の場合', () => {
            const portInfos = [
                { port: 3000, isOpen: true },
                { port: 3000, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            // 重複ポートの場合の動作確認
            expect(result).toBe('localhost:3000[🟢main:🔴main:]');
        });
    });

    describe('実際の使用例のテスト', () => {
        test('Next.js開発環境のポート構成', () => {
            const portInfos = [
                { port: 3000, isOpen: true, category: 'Next.js', label: 'main' },
                { port: 3001, isOpen: true, category: 'Next.js', label: 'dev' },
                { port: 3007, isOpen: false, category: 'Next.js' },
                { port: 3008, isOpen: false, category: 'Next.js' },
                { port: 3009, isOpen: false, category: 'Next.js' }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            expect(result).toBe('localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]]');
        });

        test('マイクロサービス環境のポート構成', () => {
            const portInfos = [
                { port: 8080, isOpen: true, category: 'API', label: 'api' },
                { port: 8081, isOpen: true, category: 'API' },
                { port: 8082, isOpen: false, category: 'API' },
                { port: 9000, isOpen: true, category: 'Admin', label: 'admin' },
                { port: 5432, isOpen: true, category: 'Database' }
            ];

            const result = resolver.generateHostDisplay('localhost', portInfos, statusIcons, displayOptions);
            
            expect(result).toBe('localhost[API:808[🟢api:0|🟢:1|🔴:2] Admin:[🟢admin] Database:[🟢postgresql:5432]]');
        });
    });
});
