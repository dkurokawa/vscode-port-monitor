# Port Monitor - Development Test Settings

VS Code拡張機能のテスト用設定例です。

## setti## 期待される表示例

### 基本形式での表示（ラベル・連番混在）
```
localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]
```

### カテゴリ別形式での表示（ラベルと番号混在）
```
localhost[Next.js:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9] Web:[🔴http:80|🔴https:443]]
127.0.0.1[Services:[🔴ssh:22|🔴postgresql:5432] Development:808[🔴:0|🔴:1|🔴:2|🔴:3|🔴:4|🔴:5|🔴:6|🔴:7|🔴:8|🔴:9]]
```

### 共通プレフィックスが3文字の場合（[3000,3001,3007,3008,3009]）
```
localhost:300[🟢main:0|🟢dev:1|🔴:7|🔴:8|🔴:9]
```

### 共通プレフィックスが2文字の場合（[3000,3001,4000]）
```
localhost:30[🟢main:00|🟢dev:01|🔴4000]
```

### 共通プレフィックスが無い場合
```
localhost:[🟢main:3000|🟢dev:3001|🔴8080|🔴9000]
```## 基本形式（単純配列）
```json
{
  "portMonitor.hosts": {
    "localhost": [3000, 3001, "3002-3005", "http", "https"],
    "127.0.0.1": ["ssh", "postgresql"]
  }
}
```

### カテゴリ別形式（新機能）
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Next.js": [3000, 3001, "3002-3009"],
      "Web": ["http", "https"]
    },
    "127.0.0.1": {
      "Services": ["ssh", "postgresql"],
      "Development": ["8080-8090"]
    }
  }
}
```

### 混在形式（両方対応）
```json
{
  "portMonitor.hosts": {
    "localhost": {
      "Next.js": [3000, 3001, "3002-3009"],
      "Web": ["http", "https"]
    },
    "production.server": [22, 80, 443],
    "127.0.0.1": ["ssh", "postgresql"]
  },
  "portMonitor.portLabels": {
    "3000": "frontend",
    "3001": "backend",
    "300*": "dev-env",
    "80": "web",
    "443": "secure-web",
    "*": "other"
  },
  "portMonitor.statusIcons": {
    "open": "🟢",
    "closed": "🔴"
  },
  "portMonitor.displayOptions": {
    "separator": "|",
    "showFullPortNumber": false,
    "compactRanges": true
  },
  "portMonitor.intervalMs": 3000,
  "portMonitor.enableProcessKill": true,
  "portMonitor.confirmBeforeKill": true,
  "portMonitor.enableLogViewer": true,
  "portMonitor.logBufferSize": 1000,
  "portMonitor.autoScrollLog": true
}
```

## テスト手順

1. F5キーを押してExtension Development Hostを起動
2. 新しいVS Codeウィンドウで上記設定を追加
3. ステータスバーにポート監視結果が表示されることを確認
4. ポートアイテムをクリックしてコンテキストメニューをテスト

## 期待される表示例

### 基本形式での表示
```
localhost[frontend:[�3000] backend:[🔴3001] dev-env:300[🔴:2|🔴:3|🔴:4|🔴:5] Other:[🔴web|🔴secure-web]]
127.0.0.1[Other:[🔴ssh|🔴postgresql]]
```

### カテゴリ別形式での表示（連番対応）
```
localhost[Next.js:[🟢3000|�3001 300[🔴:7|🔴:8|🔴:9]] Web:[🔴http:80|🔴https:443]]
127.0.0.1[Services:[🔴ssh:22|🔴postgresql:5432] Development:808[🔴:0|🔴:1|🔴:2|🔴:3|🔴:4|🔴:5|🔴:6|🔴:7|🔴:8|🔴:9]]
```

### 混在形式での表示
```
localhost[Next.js:300[🟢:0|🔴:1|🔴:2] Web:[🔴http|🔴https]]
production.server[Other:[🔴ssh|🔴web|🔴secure-web]]
127.0.0.1[Other:[🔴ssh|🔴postgresql]]
```
