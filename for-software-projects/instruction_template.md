# instruction.html 作成手順（汎用テンプレート）

## 概要
各プロジェクトで `instruction.html` を作成することで、環境情報・セットアップ・使い方・注意点などを分かりやすくまとめ、他の開発者や利用者が参照しやすくします。

## 推奨構成
- `your-project/.html/instruction.html` のように、プロジェクト配下の `.html` ディレクトリに配置
- HTML5形式、スタイルや構造は自由ですが、下記の要素を含めると便利です

### 必須要素例
```html
<div class="env-info">
  <strong>対応環境:</strong> OSや実行環境<br>
  <strong>実行形式:</strong> CLI/Web/Library など<br>
</div>
<details>
  <summary>詳細情報</summary>
  <div>
    <h2>プロジェクト概要</h2>
    <p>このプロジェクトは ...</p>
    <!-- セットアップ・使い方・注意点などを記載 -->
  </div>
</details>
```

## 作成手順
1. `.html` ディレクトリを作成（なければ）
2. 上記テンプレートを参考に `instruction.html` を作成
3. 必要に応じてスタイルや多言語対応を追加

## 自動集約について
- `ppn-page/update_summaries.sh` を使うことで、各プロジェクトの `instruction.html` から summary 情報を自動抽出し、トップページに集約できます
- summary抽出には `<div class="env-info">` と日本語 `<div lang="ja">` の最初の `<p>` が利用されます

## 参考
- 他プロジェクトの `instruction.html` を参考にすると良いでしょう
