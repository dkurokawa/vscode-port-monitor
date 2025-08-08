# instruction.html の生成方法

## 概要
`instruction.html` は Portman の GitHub Pages 用のドキュメントで、`generate-docs.sh` スクリプトによって自動生成されます。

## 生成手順

### 1. スクリプトの実行
```bash
cd portman-go
./generate-docs.sh
```

### 2. 生成プロセス
スクリプトは以下の処理を実行します：

1. **バージョン情報の取得**
   - `cmd/portman/version.go` からバージョンを抽出
   - ビルド日付を現在の日付（UTC）で設定

2. **HTMLファイルの生成**
   - `docs/instruction.html` にHTMLを出力
   - バージョンプレースホルダーを実際のバージョンに置換

3. **ファイルのコピー**
   - 生成したファイルをプロジェクトルートにもコピー

### 3. 生成されるファイル
- `portman-go/docs/instruction.html` - メインの出力先
- `portman/instruction.html` - プロジェクトルートへのコピー

## HTMLの内容

### 主要セクション
- **概要**: Portman の紹介と対応環境
- **詳細機能**: 主な機能と使用例
- **インストール方法**: プラットフォーム別のインストール手順
- **クイックスタート**: 基本的な使い方
- **リンク**: GitHub、リリース、ドキュメントへのリンク

### スタイリング
- モダンなCSS設計（CSS変数使用）
- レスポンシブデザイン対応
- アコーディオン形式の詳細セクション
- プラットフォームバッジ表示

## バージョン管理

### バージョン番号の更新
バージョンは `cmd/portman/version.go` で管理されています：
```go
const version = "v1.2.0"
```

### プレースホルダー
HTMLテンプレート内の `VERSION_PLACEHOLDER` が実際のバージョンに置換されます：
- ヘッダーのバージョンバッジ
- ダウンロードURLのバージョン部分

## カスタマイズ

### HTMLの編集
`generate-docs.sh` 内のヒアドキュメント（EOF間）を編集することで、HTMLの内容を変更できます。

### スタイルの変更
CSS変数を調整することで、カラーテーマを簡単に変更可能：
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    --text-color: #1f2937;
    --bg-color: #f9fafb;
}
```

## 注意事項
- スクリプト実行時は `portman-go` ディレクトリにいる必要があります
- バージョン情報は `version.go` から自動的に取得されます
- 生成後のHTMLは約500行、スタイルとJavaScriptを含む単一ファイルです