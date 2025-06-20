# VS Code Port Monitor Extension - Installation & Testing Guide

## 生成されたファイル

✅ **VSIXパッケージが正常に作成されました！**
- ファイル名: `vscode-port-monitor-0.1.0.vsix`
- サイズ: 31.95 KB (最適化済み)
- 含まれるファイル: 15個 (必要なファイルのみ)

## 拡張機能のテスト方法

### 方法1: Extension Development Host (推奨)
1. VS Codeでこのプロジェクトを開く
2. F5キーを押すか、デバッグビューから「Run Extension」を実行
3. 新しいExtension Development Hostウィンドウが開く
4. 設定を追加してテスト

### 方法2: VSIXファイルから直接インストール（他プロジェクトでも使用可能）
1. VS Codeを開く
2. コマンドパレット（Cmd+Shift+P）で "Extensions: Install from VSIX" を実行
3. `vscode-port-monitor-0.1.0.vsix` ファイルを選択
4. 拡張機能がインストールされる

**✅ この方法なら、他のプロジェクトでもすぐに使用可能！**

### 方法3: VSCodeコマンドライン（codeコマンドが利用可能な場合）
```bash
code --install-extension vscode-port-monitor-0.1.0.vsix
```

### 🚀 他プロジェクトでの使用方法
1. **VSIXファイルをコピー**: `vscode-port-monitor-0.1.0.vsix` を他のプロジェクトフォルダにコピー
2. **VSIXからインストール**: 上記の方法2でインストール
3. **設定追加**: 各プロジェクトの `settings.json` に設定を追加
4. **即座に利用開始**: ステータスバーでポート監視が開始される

**💡 ヒント**: 一度インストールすれば、VS Code全体で使用可能になります。

## テスト用設定例

### Next.js開発環境（推奨）
設定ファイル（settings.json）に以下を追加：

```json
{
  "portMonitor.hosts": {
    "Next.js Development": {
      "localhost": [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009]
    },
    "Database": {
      "localhost": [5432, 3306, 27017]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Main App",
    "3001": "Admin Panel",
    "3002": "Storybook",
    "3003": "API Docs",
    "3004-3009": "Feature Branches",
    "5432": "PostgreSQL",
    "3306": "MySQL",
    "27017": "MongoDB"
  },
  "portMonitor.displayOptions": {
    "separator": " | ",
    "maxDisplayLength": 150,
    "compactRanges": true,
    "showFullPortNumber": false
  }
}
```

### 📚 豊富なサンプル設定
用途に応じた設定例を豊富に用意しています：

- **[SAMPLE_CONFIGURATIONS.md](./SAMPLE_CONFIGURATIONS.md)** - フレームワーク別・技術別の設定例
- **[USE_CASE_EXAMPLES.md](./USE_CASE_EXAMPLES.md)** - 実際の開発シーン別の設定例

### 主要な設定パターン
- **Next.js (3000-3009)**: 複数インスタンス対応
- **MERN Stack**: React + Express + MongoDB + Redis
- **マイクロサービス**: 複数API + データベース群
- **フルスタック**: フロントエンド + バックエンド + DB
- **モバイル開発**: React Native + Expo + API
- **DevOps**: CI/CD + 監視 + コンテナ

## 動作確認

1. **ステータスバー表示**: 設定したポートのステータスが表示される
2. **リアルタイム更新**: ポートの開閉状態が自動で更新される
3. **ラベル表示**: 設定したラベルが表示される
4. **カテゴリ表示**: ホストがカテゴリ別に整理される
5. **コマンド実行**: コマンドパレットから各種機能を実行可能

## 次のステップ

1. **UXテスト**: 実際の使用感を確認
2. **パフォーマンステスト**: 複数ポート監視時の負荷確認
3. **設定調整**: 表示オプションの微調整
4. **Marketplace公開**: 最終調整後に公開

## パッケージ詳細

- **名前**: Port Monitor
- **バージョン**: 0.1.0
- **発行者**: port-monitor-dev
- **ライセンス**: MIT
- **サポート**: VS Code 1.60.0以上
