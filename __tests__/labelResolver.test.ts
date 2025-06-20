/**
 * 🧪 LabelResolver テストケース
 * 表示パターンの期待動作を明確化
 */

// Mock VS Code modules
const mockPatternMatcher = {
    findBestMatch: jest.fn()
};

const mockPortRange = {
    getPortName: jest.fn()
};

jest.mock('../src/patternMatcher', () => ({ PatternMatcher: mockPatternMatcher }));
jest.mock('../src/portRange', () => ({ PortRange: mockPortRange }));

import { LabelResolver } from '../src/labelResolver';

describe('🚀 LabelResolver 表示ロジック', () => {
    let resolver: LabelResolver;
    const icons = { open: '🟢', closed: '🔴' };
    const options = { separator: '|', showFullPortNumber: false, compactRanges: true };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Pattern matching mock
        mockPatternMatcher.findBestMatch.mockImplementation((patterns: string[], port: number) => {
            return patterns.find(p => p === port.toString());
        });

        // Well-known ports mock
        mockPortRange.getPortName.mockImplementation((port: number) => {
            const wellKnown: Record<number, string> = {
                22: 'ssh', 80: 'http', 443: 'https', 5432: 'postgresql'
            };
            return wellKnown[port];
        });

        resolver = new LabelResolver({
            '3000': 'main',
            '3001': 'dev',
            '8080': 'api'
        });
    });

    describe('📊 共通プレフィックス', () => {
        test('✅ [3000,3001,3007,3008,3009] → 300[0|1|7|8|9]', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true }, 
                { port: 3007, isOpen: false },
                { port: 3008, isOpen: false },
                { port: 3009, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]');
        });

        test('⚠️ [3000,3001,3100] → 1文字共通は無効（通常表示）', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true },
                { port: 3100, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            // 1文字共通は無効なので通常表示
            expect(result).toBe('localhost:[🟢main|🟢dev|🔴3100]');
        });

        test('✅ [3000,3010,3020] → 30[00|10|20]', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3010, isOpen: true },
                { port: 3020, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost:30[🟢main:00|🟢:10|🔴:20]');
        });

        test('❌ [3000,4000,8080] → 通常表示', () => {
            const ports = [
                { port: 3000, isOpen: true },
                { port: 4000, isOpen: false },
                { port: 8080, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost:[🟢main|🔴4000|🟢api]');
        });
    });

    describe('🏷️ ラベル表示', () => {
        test('✅ ラベル混在', () => {
            const ports = [
                { port: 3000, isOpen: true },   // main
                { port: 3002, isOpen: false }   // ラベルなし
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost:300[🟢main:0|🔴:2]');
        });

        test('🌐 well-known ports', () => {
            const ports = [
                { port: 80, isOpen: true },
                { port: 443, isOpen: false }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost:[🟢http:80|🔴https:443]');
        });
    });

    describe('📁 カテゴリ表示', () => {
        test('🏗️ カテゴリグループ', () => {
            const ports = [
                { port: 3000, isOpen: true, category: 'Next.js' },
                { port: 80, isOpen: true, category: 'Web' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost[Next.js:[🟢main] Web:[🟢http:80]]');
        });

        test('📦 カテゴリ内共通部', () => {
            const ports = [
                { port: 3000, isOpen: true, category: 'Next.js' },
                { port: 3001, isOpen: true, category: 'Next.js' },
                { port: 3007, isOpen: false, category: 'Next.js' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7]]');
        });
    });

    describe('⚙️ オプション', () => {
        test('🔢 showFullPortNumber=true', () => {
            const fullOptions = { ...options, showFullPortNumber: true };
            const ports = [{ port: 3000, isOpen: true }];

            const result = resolver.generateHostDisplay('localhost', ports, icons, fullOptions);
            expect(result).toBe('localhost:[🟢main:3000]');
        });

        test('📏 compactRanges=false', () => {
            const noCompact = { ...options, compactRanges: false };
            const ports = [
                { port: 3000, isOpen: true },
                { port: 3001, isOpen: true }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, noCompact);
            expect(result).toBe('localhost:[🟢main|🟢dev]');
        });
    });

    describe('🚀 実用例', () => {
        test('⚛️ Next.js環境', () => {
            const ports = [
                { port: 3000, isOpen: true, category: 'Next.js', label: 'main' },
                { port: 3001, isOpen: true, category: 'Next.js', label: 'dev' },
                { port: 3007, isOpen: false, category: 'Next.js' },
                { port: 3008, isOpen: false, category: 'Next.js' },
                { port: 3009, isOpen: false, category: 'Next.js' }
            ];

            const result = resolver.generateHostDisplay('localhost', ports, icons, options);
            expect(result).toBe('localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]]');
        });
    });
});
