# Port Monitor - Use Case Examples

実際の開発シーンに合わせた具体的な設定例を紹介します。

## 🎯 実践的なユースケース

### Case 1: スタートアップのフルスタック開発
```json
{
  "portMonitor.hosts": {
    "メインアプリ": {
      "localhost": [3000, 3001, 3002]
    },
    "マイクロサービス": {
      "localhost": [8001, 8002, 8003, 8004]
    },
    "インフラ": {
      "localhost": [5432, 6379, 9200]
    },
    "開発ツール": {
      "localhost": [6006, 4000, 8080]
    }
  },
  "portMonitor.portLabels": {
    "3000": "顧客向けアプリ",
    "3001": "管理画面",
    "3002": "ランディングページ",
    "8001": "認証API",
    "8002": "ユーザーAPI",
    "8003": "決済API",
    "8004": "通知API",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "9200": "Elasticsearch",
    "6006": "Storybook",
    "4000": "GraphQL Playground",
    "8080": "API Gateway"
  },
  "portMonitor.displayOptions": {
    "separator": " | ",
    "compactRanges": true,
    "maxDisplayLength": 180
  }
}
```

### Case 2: 大企業のマルチプロジェクト環境
```json
{
  "portMonitor.hosts": {
    "プロジェクトA": {
      "localhost": [3000, 3001, 5000, 5001]
    },
    "プロジェクトB": {
      "localhost": [3010, 3011, 5010, 5011]
    },
    "プロジェクトC": {
      "localhost": [3020, 3021, 5020, 5021]
    },
    "共通インフラ": {
      "localhost": [5432, 3306, 6379, 27017]
    },
    "開発支援": {
      "localhost": [6006, 6016, 6026, 8080]
    }
  },
  "portMonitor.portLabels": {
    "3000": "A: 顧客画面",
    "3001": "A: 管理画面",
    "5000": "A: API",
    "5001": "A: Worker",
    "3010": "B: 顧客画面",
    "3011": "B: 管理画面",
    "5010": "B: API",
    "5011": "B: Worker",
    "3020": "C: 顧客画面",
    "3021": "C: 管理画面",
    "5020": "C: API",
    "5021": "C: Worker",
    "5432": "PostgreSQL",
    "3306": "MySQL",
    "6379": "Redis",
    "27017": "MongoDB",
    "6006": "A: Storybook",
    "6016": "B: Storybook",
    "6026": "C: Storybook",
    "8080": "共通Gateway"
  }
}
```

### Case 3: E-Commerce開発チーム
```json
{
  "portMonitor.hosts": {
    "フロントエンド": {
      "localhost": [3000, 3001, 3002, 3003]
    },
    "バックエンドAPI": {
      "localhost": [8000, 8001, 8002, 8003, 8004]
    },
    "決済・外部連携": {
      "localhost": [9000, 9001, 9002]
    },
    "データベース": {
      "localhost": [5432, 3306, 6379, 27017]
    }
  },
  "portMonitor.portLabels": {
    "3000": "ショップ画面",
    "3001": "管理画面",
    "3002": "モバイルアプリ",
    "3003": "POS システム",
    "8000": "商品API",
    "8001": "ユーザーAPI",
    "8002": "注文API",
    "8003": "在庫API",
    "8004": "レコメンドAPI",
    "9000": "決済Gateway",
    "9001": "外部API Proxy",
    "9002": "Webhook Handler",
    "5432": "商品DB",
    "3306": "ユーザーDB",
    "6379": "セッション",
    "27017": "ログ・分析"
  }
}
```

### Case 4: SaaS開発（マルチテナント）
```json
{
  "portMonitor.hosts": {
    "テナントA": {
      "localhost": [3000, 5000]
    },
    "テナントB": {
      "localhost": [3001, 5001]
    },
    "テナントC": {
      "localhost": [3002, 5002]
    },
    "管理・共通": {
      "localhost": [3100, 5100, 8080]
    },
    "インフラ": {
      "localhost": [5432, 6379, 9200, 5601]
    }
  },
  "portMonitor.portLabels": {
    "3000": "テナントA UI",
    "5000": "テナントA API",
    "3001": "テナントB UI",
    "5001": "テナントB API",
    "3002": "テナントC UI",
    "5002": "テナントC API",
    "3100": "管理画面",
    "5100": "管理API",
    "8080": "プロキシ",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "9200": "Elasticsearch",
    "5601": "Kibana"
  },
  "portMonitor.displayOptions": {
    "separator": " • ",
    "compactRanges": false,
    "showFullPortNumber": true,
    "maxDisplayLength": 200
  }
}
```

### Case 5: モバイルアプリ開発（React Native + Backend）
```json
{
  "portMonitor.hosts": {
    "React Native": {
      "localhost": [8081, 19000, 19001, 19002]
    },
    "API開発": {
      "localhost": [3000, 3001, 3002]
    },
    "モックサーバー": {
      "localhost": [4000, 4001, 4002]
    },
    "データベース": {
      "localhost": [5432, 6379]
    },
    "開発ツール": {
      "localhost": [9090, 3030, 8080]
    }
  },
  "portMonitor.portLabels": {
    "8081": "Metro Bundler",
    "19000": "Expo DevTools",
    "19001": "iOS Simulator",
    "19002": "Android Emulator",
    "3000": "認証API",
    "3001": "データAPI",
    "3002": "通知API",
    "4000": "認証Mock",
    "4001": "データMock",
    "4002": "通知Mock",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "9090": "Flipper",
    "3030": "Storybook",
    "8080": "API Gateway"
  }
}
```

### Case 6: AI/ML開発環境
```json
{
  "portMonitor.hosts": {
    "Jupyter環境": {
      "localhost": [8888, 8889, 8890, 8891]
    },
    "ML API": {
      "localhost": [5000, 5001, 5002, 5003]
    },
    "フロントエンド": {
      "localhost": [3000, 3001]
    },
    "データ基盤": {
      "localhost": [5432, 27017, 9200, 6379]
    },
    "監視・可視化": {
      "localhost": [6006, 4040, 9090, 3333]
    }
  },
  "portMonitor.portLabels": {
    "8888": "Jupyter Lab",
    "8889": "Jupyter Notebook",
    "8890": "JupyterHub",
    "8891": "Jupyter (実験用)",
    "5000": "推論API",
    "5001": "学習API",
    "5002": "前処理API",
    "5003": "評価API",
    "3000": "ML管理画面",
    "3001": "実験結果画面",
    "5432": "PostgreSQL",
    "27017": "MongoDB",
    "9200": "Elasticsearch",
    "6379": "Redis",
    "6006": "TensorBoard",
    "4040": "Spark UI",
    "9090": "Prometheus",
    "3333": "MLflow"
  }
}
```

### Case 7: ゲーム開発（Unity + サーバー）
```json
{
  "portMonitor.hosts": {
    "ゲームサーバー": {
      "localhost": [7777, 7778, 7779, 7780]
    },
    "Web管理": {
      "localhost": [3000, 3001, 8080]
    },
    "データベース": {
      "localhost": [5432, 6379, 27017]
    },
    "分析・監視": {
      "localhost": [9090, 3030, 8086]
    }
  },
  "portMonitor.portLabels": {
    "7777": "メインゲーム",
    "7778": "マッチメイキング",
    "7779": "ロビーサーバー",
    "7780": "チャットサーバー",
    "3000": "管理画面",
    "3001": "プレイヤー画面",
    "8080": "API Gateway",
    "5432": "ゲームDB",
    "6379": "セッション",
    "27017": "ログ・統計",
    "9090": "監視",
    "3030": "分析画面",
    "8086": "メトリクス"
  }
}
```

### Case 8: DevOps・CI/CD環境
```json
{
  "portMonitor.hosts": {
    "アプリケーション": {
      "localhost": [3000, 3001, 3002]
    },
    "CI/CD": {
      "localhost": [8080, 8081, 9000]
    },
    "監視・ログ": {
      "localhost": [9090, 3333, 9200, 5601]
    },
    "データベース": {
      "localhost": [5432, 6379]
    },
    "コンテナ": {
      "localhost": [2375, 2376, 8000]
    }
  },
  "portMonitor.portLabels": {
    "3000": "Dev環境",
    "3001": "Staging環境",
    "3002": "Test環境",
    "8080": "Jenkins",
    "8081": "GitLab CI",
    "9000": "SonarQube",
    "9090": "Prometheus",
    "3333": "Grafana",
    "9200": "Elasticsearch",
    "5601": "Kibana",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "2375": "Docker API",
    "2376": "Docker TLS",
    "8000": "Portainer"
  }
}
```

### Case 9: 教育・学習環境
```json
{
  "portMonitor.hosts": {
    "学習プロジェクト1": {
      "localhost": [3000, 5000]
    },
    "学習プロジェクト2": {
      "localhost": [3001, 5001]
    },
    "学習プロジェクト3": {
      "localhost": [3002, 5002]
    },
    "チュートリアル": {
      "localhost": [8080, 8081, 8082]
    },
    "共通ツール": {
      "localhost": [5432, 6379, 6006]
    }
  },
  "portMonitor.portLabels": {
    "3000": "React学習",
    "5000": "Express学習",
    "3001": "Vue学習",
    "5001": "FastAPI学習",
    "3002": "Angular学習",
    "5002": "Django学習",
    "8080": "HTML/CSS練習",
    "8081": "JavaScript練習",
    "8082": "TypeScript練習",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "6006": "Storybook"
  },
  "portMonitor.displayOptions": {
    "separator": " | ",
    "compactRanges": true,
    "showFullPortNumber": false,
    "maxDisplayLength": 120
  }
}
```

### Case 10: フリーランス・複数クライアント
```json
{
  "portMonitor.hosts": {
    "クライアントA": {
      "localhost": [3000, 3001, 5000]
    },
    "クライアントB": {
      "localhost": [3010, 3011, 5010]
    },
    "クライアントC": {
      "localhost": [3020, 3021, 5020]
    },
    "個人プロジェクト": {
      "localhost": [3100, 5100]
    },
    "共通ツール": {
      "localhost": [5432, 6379, 6006]
    }
  },
  "portMonitor.portLabels": {
    "3000": "A: ECサイト",
    "3001": "A: 管理画面",
    "5000": "A: API",
    "3010": "B: コーポレート",
    "3011": "B: CMS",
    "5010": "B: API",
    "3020": "C: ブログ",
    "3021": "C: ダッシュボード",
    "5020": "C: API",
    "3100": "個人: ポートフォリオ",
    "5100": "個人: API",
    "5432": "PostgreSQL",
    "6379": "Redis",
    "6006": "Storybook"
  },
  "portMonitor.displayOptions": {
    "separator": " • ",
    "compactRanges": false,
    "showFullPortNumber": true,
    "maxDisplayLength": 160
  }
}
```
