# VSCode Port Monitor - 詳細仕様書

## 🎯 プロジェクトの独自性

### 競合分析
既存のVS Code拡張機能との比較：

| 拡張機能 | 機能 | 我々との違い |
|----------|------|-------------|
| `piyush-bhatt.vscode-port` | ポート可用性チェック | 単発チェックのみ、リアルタイム監視なし |
| `ms-vscode.vscode-serial-monitor` | シリアルポート監視 | シリアル通信特化、TCP/IPポート監視なし |
| `mutantdino.resourcemonitor` | システムリソース監視 | CPU/メモリのみ、ポート状態なし |
| `njzy.stats-bar` | システム統計表示 | ネットワーク速度のみ、ポート監視なし |

### 独自価値
- ✅ **複数ホスト・複数ポートの同時監視** - 既存にはない機能
- ✅ **リアルタイム状態表示** - ステータスバーでの継続監視
- ✅ **ポートラベル機能** - 分かりやすい名前での管理
- ✅ **Globパターンマッチング** - 柔軟なラベル設定
- ✅ **視覚的な状態表示** - 絵文字とコンパクトな表示

## 📋 機能仕様

### 監視対象
- 複数ホスト・複数ポートを監視可能
- ポートは以下のように指定可能：
  - 数値: `3000`
  - 範囲: `"3000-3009"`
  - Well-known名: `"http"`, `"https"`, `"ssh"`, `"postgresql"` など
- ポートにラベル（名前）を付けることが可能：
  - `portLabels` で `"ポート番号": "ラベル名"` として設定
  - 表示時は `ラベル:ポート末尾` 形式（例：`user:0` は3000番ポートのuserラベル）

### 表示形式
- ステータスバーに以下のような形式で表示：
  ```
  localhost: 300[🟢user:0|🔴car:1|🔴2|🔴3|🟢4]
  db-server.local: [🔴postgresql:5432]
  ```
- ポート末尾や番号全体の表示形式、アイコン（🟢🔴）はカスタマイズ可能
- ポートにラベルが設定されている場合は「ラベル:ポート末尾」形式で表示
- 範囲指定でないポートも完全なポート番号を表示
- ポート間の区切り文字（デフォルト: `|`）をカスタマイズ可能

### インタラクション機能
- **ステータスバーアイテムクリック** - ポート管理メニューを表示
- **コンテキストメニュー**：
  - 🔄 **更新** - 手動でポート状態を再チェック
  - 🛑 **プロセス停止** - 選択したポートで動作中のプロセスを停止
  - 📺 **ログ表示** - プロセスのstdout/stderr出力をリアルタイム表示
  - 📊 **プロセス詳細** - PID、コマンド、実行時間等の詳細情報
  - ⚙️ **設定を開く** - portMonitor設定画面を開く
  - � **詳細表示** - ポート詳細情報をパネルで表示

## ⚙️ 設定項目

### 基本設定
```json
{
  "portMonitor.hosts": {
    "localhost": ["http", 3000, "3001-3003", "https"],
    "db-server.local": ["postgresql"]
  },
  "portMonitor.statusIcons": {
    "open": "🟢",
    "closed": "🔴"
  },
  "portMonitor.intervalMs": 3000,
  "portMonitor.portLabels": {
    "3000": "user",
    "3001": "car"
  },
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true,
  "portMonitor.enableLogViewer": true,
  "portMonitor.logBufferSize": 1000,
  "portMonitor.autoScrollLog": true,
  "portMonitor.displayOptions": {
    "separator": "|",
    "showFullPortNumber": false,
    "compactRanges": true
  }
}
```

### 設定項目詳細
| 設定名 | 型 | 説明 | デフォルト |
|--------|-----|------|------------|
| `portMonitor.hosts` | Object | 監視対象のホストとポート | `{}` |
| `portMonitor.statusIcons` | Object | ステータスアイコンの設定 | `{"open": "🟢", "closed": "🔴"}` |
| `portMonitor.intervalMs` | Number | 監視間隔（ミリ秒） | `3000` |
| `portMonitor.portLabels` | Object | ポートラベル設定（パターンマッチング対応） | `{}` |
| `portMonitor.enableProcessKill` | Boolean | プロセス停止機能の有効化 | `true` |
| `portMonitor.confirmBeforeKill` | Boolean | プロセス停止前の確認ダイアログ表示 | `true` |
| `portMonitor.enableLogViewer` | Boolean | プロセスログ表示機能の有効化 | `true` |
| `portMonitor.logBufferSize` | Number | ログバッファサイズ（行数） | `1000` |
| `portMonitor.autoScrollLog` | Boolean | ログの自動スクロール | `true` |
| `portMonitor.displayOptions.separator` | String | ポート間の区切り文字 | `"|"` |
| `portMonitor.displayOptions.showFullPortNumber` | Boolean | 完全なポート番号を表示 | `false` |
| `portMonitor.displayOptions.compactRanges` | Boolean | 範囲表示の圧縮（3000-3009→300[0-9]） | `true` |

### ポートラベルのパターンマッチング
`portMonitor.portLabels` では以下のパターンが使用可能：

| パターン | 説明 | 例 |
|----------|------|-----|
| `"3000"` | 完全一致 | ポート3000のみ |
| `"300*"` | 前方一致 | 3000, 3001, 3002... |
| `"*000"` | 後方一致 | 3000, 4000, 5000... |
| `"30?0"` | 単一文字ワイルドカード | 3000, 3010, 3020... |
| `"*"` | 全ポート | 全ての未設定ポート |

### パターンの優先順位
1. **完全一致** - 最高優先度
2. **具体的パターン** - より具体的なパターンが優先
3. **ワイルドカード** - 最低優先度

```json
{
  "portMonitor.portLabels": {
    "3000": "frontend",     // 完全一致（最優先）
    "300*": "dev-services", // 3001, 3002... に適用
    "*": "unknown"          // その他全て（最低優先）
  }
}
```

## 🚫 制限事項
- `intervalMs` は1000ms未満禁止（過負荷防止）
- 展開後のポート数は最大100個
- ポート番号は `1〜65535` 範囲内、`0` やマイナス値は無効
- `WELL_KNOWN_PORTS` は内部で定義し拡張可能
- **プロセス停止機能**：
  - localhostのみサポート（リモートホストでのプロセス停止は不可）
  - 管理者権限が必要なプロセスは停止できない場合がある
  - システムプロセスの停止は安全のため制限
- **ログ表示機能**：
  - localhostのプロセスのみサポート
  - 既に起動済みのプロセスは、監視開始時点からのログのみ取得可能
  - 一部のプロセス（デーモン、サービス）はログ取得できない場合がある
  - ログバッファサイズを超えた古いログは自動削除

## 💡 使用例

### 基本設定例
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 3001, "3002-3004"]
  },
  "portMonitor.portLabels": {
    "3000": "user",
    "3001": "car"
  }
}
```

### 表示カスタマイズ例
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 5432, 8080],
    "api-server": [9000, 9001]
  },
  "portMonitor.displayOptions": {
    "separator": " • ",              // 区切り文字を変更
    "showFullPortNumber": true,      // 完全なポート番号を表示
    "compactRanges": false           // 範囲圧縮を無効化
  }
}
```

**表示例**：
- デフォルト: `localhost: 300[🟢user:0|🔴car:1|🔴2]`
- カスタム: `localhost: [🟢user:3000 • 🔴car:3001 • 🔴3002]`
- 単体ポート: `db-server: [🔴postgresql:5432]`

### パターンマッチング例
```json
{
  "portMonitor.hosts": {
    "localhost": ["3000-3009", "8000-8009"]
  },
  "portMonitor.portLabels": {
    "3000": "main-app",    // 3000番ポートは "main-app"
    "300*": "dev-env",     // 3001-3009は "dev-env"
    "800*": "test-env",    // 8000-8009は "test-env"
    "*": "unknown"         // その他は "unknown"
  }
}
```

### 複雑なパターン例
```json
{
  "portMonitor.portLabels": {
    "3000": "frontend",         // 完全一致
    "3001": "backend",          // 完全一致
    "30??": "microservices",    // 3000-3099 (ただし上記を除く)
    "80*": "web-servers",       // 8000-8999
    "*443": "ssl-services",     // 443, 8443, 9443等
    "*": "other"                // その他全て
  }
}
```

### プロセス管理機能の使用例
```json
{
  "portMonitor.enableProcessKill": true,      // プロセス停止機能を有効化
  "portMonitor.confirmBeforeKill": true,      // 停止前に確認ダイアログを表示
  "portMonitor.enableLogViewer": true,        // ログ表示機能を有効化
  "portMonitor.logBufferSize": 1000,          // ログバッファサイズ
  "portMonitor.autoScrollLog": true           // 自動スクロール
}
```

**プロセス停止の使用手順**：
1. ステータスバーの表示をクリック
2. コンテキストメニューから「プロセス停止」を選択
3. 停止したいポート/プロセスを選択
4. 確認ダイアログで「OK」をクリック

**ログ表示の使用手順**：
1. ステータスバーの🟢アイコンをクリック（動作中のプロセスのみ）
2. コンテキストメニューから「ログ表示」を選択
3. 新しいタブでプロセスのstdout/stderrをリアルタイム表示
4. ログは自動更新され、エラーやデバッグ情報を確認可能

### 表示例
この設定により、以下のような表示になります：
- ポート3000が開放されている場合：`🟢user:0`
- ポート3001が閉じている場合：`🔴car:1`  
- ラベルが設定されていないポート3002：`🔴2`
- 結果：`localhost: 300[🟢user:0 🔴car:1 🔴2 🔴3 🟢4]`

## 🏗️ アーキテクチャ

### ディレクトリ構成
```
vscode-port-monitor/
├── src/
│   ├── extension.ts        # 拡張機能のエントリーポイント
│   ├── config.ts          # 設定読み込み・バリデーション
│   ├── portRange.ts       # ポート範囲・名前解決
│   ├── monitor.ts         # ポート監視ロジック
│   └── labelResolver.ts   # ポートラベル解決
├── package.json
├── tsconfig.json
├── .vscode/
│   └── launch.json
├── SPECIFICATION.md       # 本ファイル
└── README.md
```

### 実装タスク
- [ ] `config.ts`: 設定読み込み＆バリデーション（ポートラベル機能を含む）
- [ ] `portRange.ts`: ポートレンジ＆名前解決（"3000-3005", "http" → [80,3000,3001,...,3005]）
- [ ] `monitor.ts`: tcp-port-used による使用状態チェック（host + port）
- [ ] `extension.ts`: ステータスバー表示（集約してホスト単位でまとめる、ラベル表示対応）
- [ ] `labelResolver.ts`: ポートラベル解決機能（ポート番号→表示名の変換、パターンマッチング対応）
- [ ] `patternMatcher.ts`: Globパターンマッチング機能
- [ ] `processManager.ts`: プロセス停止機能（PID検索、安全な停止処理）
- [ ] `logViewer.ts`: プロセスログ表示機能（stdout/stderr リアルタイム表示）
- [ ] `processTracker.ts`: プロセス追跡・監視機能（PID→プロセス詳細情報）
- [ ] `menuProvider.ts`: コンテキストメニュー機能
- [ ] 拡張のビルド・`.vsix` 生成・署名処理（任意）
