# VSCode Port Monitor

[![Visual Studio Marketplace](https://img.shields.io/badge/Visual%20Studio-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

複数のホストとポートの状態をVS Codeのステータスバーでリアルタイム監視する拡張機能です。

## ✨ 機能

- 🔍 **複数ホスト・ポートの同時監視** - 複数のサーバーやローカルポートを一括監視
- 🏷️ **ポートラベル機能** - ポートに分かりやすい名前を付けて管理
- 📊 **リアルタイム表示** - ステータスバーに監視結果を視覚的に表示
- 🛑 **プロセス管理** - ワンクリックでポートを使用中のプロセスを停止
- 📺 **ログ表示** - プロセスのstdout/stderr出力をリアルタイムで確認
- ⚙️ **柔軟な設定** - ポート範囲やWell-knownポート名での指定が可能
- 🎨 **カスタマイズ可能** - 表示アイコンや監視間隔を自由に設定

## 📸 スクリーンショット

```
localhost: 300[🟢user:0|🔴car:1|🔴2|🔴3|🟢4]
db-server.local: [🔴postgresql:5432]
api-server: [🟢9000|🔴9001]
```

## 🚀 使い方

### 1. インストール
VS Code拡張機能マーケットプレースから「Port Monitor」をインストールしてください。

### 2. 設定
`settings.json` に監視設定を追加します：

```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 3001, "3002-3004"],
    "db-server.local": ["postgresql"]
  },
  "portMonitor.portLabels": {
    "3000": "user",
    "3001": "car"
  }
}
```

### 3. 監視開始
設定後、自動的にポート監視が開始され、ステータスバーに結果が表示されます。

### 4. プロセス管理
- ステータスバーの表示をクリック
- コンテキストメニューから「プロセス停止」を選択
- 停止したいポートを選択して実行

### 5. ログ表示
- 🟢アイコンをクリック（動作中のプロセス）
- 「ログ表示」を選択してstdout/stderrを確認

## ⚙️ 設定オプション

| 設定名 | 説明 | デフォルト |
|--------|------|------------|
| `portMonitor.hosts` | 監視対象のホストとポート | `{}` |
| `portMonitor.portLabels` | ポートラベル設定（パターンマッチング対応） | `{}` |
| `portMonitor.statusIcons` | ステータスアイコン設定 | `{"open": "🟢", "closed": "🔴"}` |
| `portMonitor.intervalMs` | 監視間隔（ミリ秒、最小1000） | `3000` |
| `portMonitor.displayOptions.separator` | ポート間の区切り文字 | `"|"` |
| `portMonitor.displayOptions.showFullPortNumber` | 完全なポート番号を表示 | `false` |
| `portMonitor.enableProcessKill` | プロセス停止機能の有効化 | `true` |
| `portMonitor.enableLogViewer` | プロセスログ表示機能の有効化 | `true` |

### ポート指定方法
- **数値**: `3000`
- **範囲**: `"3000-3009"`
- **Well-known名**: `"http"`, `"https"`, `"ssh"`, `"postgresql"` など

## 📝 設定例

### 基本的な使用例
```json
{
  "portMonitor.hosts": {
    "localhost": [8080, 3000, "5432"],
    "production.example.com": ["http", "https"]
  }
}
```

### ラベル付きポート監視
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 3001, 3002]
  },
  "portMonitor.portLabels": {
    "3000": "frontend",
    "3001": "backend",
    "3002": "database"
  }
}
```

### パターンマッチングを使用したラベル設定
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3009", "8080"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",    // 3000番は特別にmain-app
    "300*": "dev-env",     // 3001-3009はdev-env
    "8080": "proxy",       // 8080番はproxy
    "*": "service"         // その他はservice
  }
}
```

### 利用可能なパターン
- `"3000"` - 完全一致
- `"300*"` - 前方一致（3000, 3001, 3002...）
- `"*80"` - 後方一致（80, 8080, 3080...）
- `"30?0"` - 単一文字ワイルドカード（3000, 3010, 3020...）
- `"*"` - 全ポート（最低優先度）

### プロセス管理機能
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3005", "8080"]
  },
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true
}
```

**操作方法**：
1. ステータスバーの🟢または🔴アイコンをクリック
2. 「プロセス停止」メニューを選択
3. 停止したいポート/プロセスを選択
4. 確認後、プロセスが安全に停止されます

### ログ表示機能
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000", "8080"]
  },
  "portMonitor.enableLogViewer": true,
  "portMonitor.logBufferSize": 1000,
  "portMonitor.autoScrollLog": true
}
```

### 表示カスタマイズ
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 5432, 8080]
  },
  "portMonitor.displayOptions": {
    "separator": " • ",              // 区切り文字をカスタマイズ
    "showFullPortNumber": true,      // 完全なポート番号を表示
    "compactRanges": false           // 範囲圧縮を無効化
  }
}
```

**表示例**：
- デフォルト: `localhost: 300[🟢0|🔴1|🔴2]`
- カスタム: `localhost: [🟢3000 • 🔴3001 • 🔴3002]`
- 単体ポート: `db-server: [🔴postgresql:5432]`

**操作方法**：
1. ステータスバーの🟢アイコンをクリック（動作中のプロセス）
2. 「ログ表示」メニューを選択
3. 新しいタブでプロセスのstdout/stderrをリアルタイム表示
4. エラーログ、デバッグ情報、アクセスログなどを確認可能

## 🔧 開発者向け情報

### 必要な依存関係
- Node.js 14.x以上
- VS Code 1.60.0以上

### ローカル開発
```bash
# リポジトリをクローン
git clone https://github.com/username/vscode-port-monitor.git
cd vscode-port-monitor

# 依存関係をインストール
npm install

# 開発用ビルド
npm run compile

# デバッグ実行
# F5キーでExtension Development Hostを起動
```

## 🐛 バグ報告・機能要求

問題を発見した場合や新機能のご要望は、[GitHub Issues](https://github.com/username/vscode-port-monitor/issues)にお寄せください。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルをご確認ください。

## 🤝 コントリビューション

プルリクエストやイシューを歓迎します！詳細は[SPECIFICATION.md](SPECIFICATION.md)をご確認ください。

---

**開発状況**: 🚧 現在開発中です