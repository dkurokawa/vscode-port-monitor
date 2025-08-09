# instruction.html 作成手順（汎用テンプレート）

## 概要
各プロジェクトで `instruction.html` を作成することで、環境情報・セットアップ・使い方・注意点などを分かりやすくまとめ、他の開発者や利用者が参照しやすくします。

## 推奨構成
- `your-project/.html/instruction.html` のように、プロジェクト配下の `.html` ディレクトリに配置
- HTML5形式。スタイルや構造は自由ですが、下記の要素を含めると便利です

### 必須要素例（多言語対応・抽出対応）
以下の例は、日本語/英語の両方を含みつつ、トップページ集約スクリプト（`update_summaries.sh`）が正しく抽出できる構造です。

```html
<!-- 1) 製品名 + バージョン（英語のみ）: NAMEは<strong>、VERSIONは平文（strongに含めない） -->
<!-- a) 推奨: 明示マーカー -->
<strong class="summary-title" lang="en">ProjectName</strong> v1.2.3
<!-- b) 代替: <h1> と <span class="_version"> or <span class="version"> の併用（抽出時に NAME / VERSION 分離） -->
<h1>ProjectName <span class="_version">v1.2.3</span></h1>

<!-- 2) 環境情報: JA/EN 両方を env-info に入れる -->
<div class="env-info">
  <div lang="ja">
    <strong>対応環境:</strong> macOS, Linux ｜ <strong>実行形式:</strong> CLI / Web / Extension 等
  </div>
  <div lang="en">
    <strong>Platform:</strong> macOS, Linux ｜ <strong>Type:</strong> CLI / Web / Extension
  </div>
</div>

<!-- 3) 概要（最初の日本語 <div lang="ja"> 内の最初の <p> を抽出します） -->
<div lang="ja">
  <p>このプロジェクトは ...（1〜2文の短い要約を推奨）</p>
  <!-- 以降は詳細説明 -->
</div>
<div lang="en">
  <p>This project ... (short summary in 1–2 sentences)</p>
</div>

<details>
  <summary>詳細情報 / Details</summary>
  <div>
    <h2 lang="ja">プロジェクト概要</h2>
    <h2 lang="en">Overview</h2>
    <p lang="ja">・・・</p>
    <p lang="en">・・・</p>
  </div>
</details>
```

## 多言語（JA/EN）対応の最小実装
- 言語切替のための簡易CSS/JS例（任意）:

```html
<style>
  [lang="en"] { display: none; }
  .en [lang="ja"] { display: none; }
  .en [lang="en"] { display: block; }
</style>
<div class="lang-switch">
  <button onclick="setLang('ja')" id="ja-btn" class="active">日本語</button>
  <button onclick="setLang('en')" id="en-btn">English</button>
</div>
<script>
  function setLang(lang) {
    document.body.className = (lang === 'en') ? 'en' : '';
    document.getElementById('ja-btn')?.classList.toggle('active', lang === 'ja');
    document.getElementById('en-btn')?.classList.toggle('active', lang === 'en');
    localStorage.setItem('doc-lang', lang);
  }
  setLang(localStorage.getItem('doc-lang') || 'ja');
</script>
```

## 作成手順
1. `.html` ディレクトリを作成（なければ）
2. 上記テンプレートを参考に `instruction.html` を作成
   - 英語の「製品名」は `<strong class="summary-title" lang="en">ProjectName</strong>` の形式で記述（VERSIONはその直後に平文で続ける）
   - 代替として `<h1>ProjectName <span class="_version">vX.Y.Z</span></h1>` でもOK（抽出スクリプト側で分離）
   - `env-info` と JA/EN の概要段落を入れる
3. 必要に応じてスタイルや詳細説明を追加

## 自動集約（トップページ反映）の仕様
- `ppn-page/update_summaries.sh` により、各プロジェクトの `instruction.html` から summary 情報を自動抽出し、トップページに集約します
- 抽出順とルール:
  1) **名称（英語）**: `strong.summary-title[lang="en"]` → なければ `<strong.summary-title>` → さらに無ければ `<h1>` の文字列から抽出（バージョン表現は除去）
  2) **バージョン**: `span._version` / `span.version` → なければタイトル内の `vX.Y.Z` または `Version X.Y.Z` を検出
  3) **環境情報**: `<div class="env-info">` 内の日本語 (`<div lang="ja">`) を抽出（HTMLタグは除去）
  4) **説明**: 最初に見つかる日本語ブロック（`<div lang="ja">`）の「最初の `<p>`」を抽出
- ベストプラクティス:
  - 日本語の「短い要約 `<p>`」を、文書の先頭（ヘッダー直後など）に配置
  - `env-info` にも JA/EN を入れておく（JAが空だと環境欄が空になります）
  - 名称は英語で統一し `<strong>`、バージョンはその直後の平文で

## 相対パスと公開URL
- `instruction.html` へのリンクは相対パス（例: `../your-project/.html/instruction.html`）を推奨
- 公開時はプロジェクトの公開URLに揃えると親切

## 参考
- 他プロジェクトの `instruction.html` を参考にすると良いでしょう
- VSCode拡張やCLIツールの例（`vscode-port-monitor`, `portman` など）を参照
