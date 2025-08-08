#!/bin/bash

# Generate instruction.html for GitHub Pages

VERSION=$(grep "version   = " cmd/portman/version.go | cut -d'"' -f2 2>/dev/null || echo "v1.2.0")
BUILD_DATE=$(date -u +"%Y-%m-%d")

# Create docs directory if it doesn't exist
mkdir -p docs

cat > docs/instruction.html << 'EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portman - AI-Friendly Port Management Tool</title>
    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #1e40af;
            --text-color: #1f2937;
            --bg-color: #f9fafb;
            --code-bg: #f3f4f6;
            --border-color: #e5e7eb;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 40px 0;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            margin: -20px -20px 40px -20px;
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .tagline {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .version {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 10px;
        }
        
        .section {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .summary {
            background: #f0f4f8;
            border-left: 4px solid var(--primary-color);
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
        }
        
        .summary h3 {
            margin-top: 0;
            color: var(--primary-color);
        }
        
        .summary p {
            margin-bottom: 10px;
        }
        
        .summary .platforms {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .summary .platform-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            border: 1px solid var(--border-color);
        }
        
        h2 {
            color: var(--primary-color);
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        h3 {
            color: var(--secondary-color);
            margin: 20px 0 10px 0;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .feature {
            background: var(--bg-color);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
        }
        
        .feature h4 {
            color: var(--primary-color);
            margin-bottom: 8px;
        }
        
        details {
            margin: 20px 0;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
        }
        
        summary {
            padding: 15px 20px;
            background: var(--code-bg);
            cursor: pointer;
            font-weight: 600;
            color: var(--secondary-color);
            user-select: none;
            transition: background-color 0.2s;
        }
        
        summary:hover {
            background: #e5e7eb;
        }
        
        details[open] summary {
            border-bottom: 1px solid var(--border-color);
        }
        
        .details-content {
            padding: 20px;
        }
        
        code {
            background: var(--code-bg);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 10px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        .install-options {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .install-btn {
            display: inline-block;
            padding: 10px 20px;
            background: var(--primary-color);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .install-btn:hover {
            background: var(--secondary-color);
        }
        
        .platform-section {
            margin: 20px 0;
            padding: 20px;
            background: var(--bg-color);
            border-radius: 8px;
        }
        
        .platform-section h4 {
            color: var(--primary-color);
            margin-bottom: 10px;
        }
        
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .info {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            header {
                margin: -10px -10px 30px -10px;
                padding: 30px 10px;
            }
            
            h1 {
                font-size: 2em;
            }
            
            .section {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>🚢 Portman</h1>
            <p class="tagline">AI-Friendly Port Management Tool</p>
            <span class="version">Version VERSION_PLACEHOLDER</span>
        </div>
    </header>
    
    <div class="container">
        <section class="section">
            <h2>概要</h2>
            
            <div class="summary">
                <h3>🎯 対応環境とツールの概要</h3>
                <p><strong>Portman</strong>は、ローカル開発環境でのポート管理を簡単にするツールです。</p>
                <p>複数のプロジェクトを同時に開発する際の「ポート番号の競合」を防ぎ、チーム内でポート番号を統一できます。</p>
                <div class="platforms">
                    <span class="platform-badge">🍎 macOS (Intel/Apple Silicon)</span>
                    <span class="platform-badge">🐧 Linux (Intel/AMD/ARM)</span>
                    <span class="platform-badge">🤖 AI Assistant対応</span>
                    <span class="platform-badge">📦 Go 1.20+</span>
                </div>
            </div>
            
            <p>Portmanは、複数の開発プロジェクトを同時に扱う開発者のための<strong>ポート管理レジストリ</strong>です。
            各プロジェクトがどのポートを使用しているかを一元管理し、ポート競合を防ぎます。</p>
            
            <div class="info">
                <strong>📝 重要:</strong> Portmanはポートの「登録管理」を行うツールであり、実際のポート使用を制限するものではありません。
                既に使用中のポートも登録でき、チーム内でポート番号を共有できます。
            </div>
            
            <div class="features">
                <div class="feature">
                    <h4>🤖 AI最適化</h4>
                    <p>JSON出力、構造化エラー、MCPサーバー対応でAIツールとの連携が簡単</p>
                </div>
                <div class="feature">
                    <h4>🚀 自動割り当て</h4>
                    <p>3000-3999の範囲で利用可能なポートを自動的に検出・割り当て</p>
                </div>
                <div class="feature">
                    <h4>🔍 プロジェクト検出</h4>
                    <p>Node.js、Go、Python、Rust等のプロジェクトを自動検出</p>
                </div>
                <div class="feature">
                    <h4>⚡ 強制割り当て</h4>
                    <p>--forceオプションで他プロジェクトからポートを安全に再割り当て</p>
                </div>
            </div>
        </section>
        
        <section class="section">
            <details>
                <summary>📖 詳細機能</summary>
                <div class="details-content">
                    <h3>主な機能</h3>
                    <ul>
                        <li><strong>階層的な管理:</strong> <code>group/service</code>形式でポートを整理</li>
                        <li><strong>プロジェクト設定:</strong> <code>.portmanrc.yaml</code>でプロジェクト固有の設定</li>
                        <li><strong>Webダッシュボード:</strong> http://localhost:8081 でビジュアル管理</li>
                        <li><strong>PIDバインディング:</strong> プロセス終了時の自動ポート解放</li>
                        <li><strong>構造化エラー:</strong> AI向けのJSON形式エラーメッセージ</li>
                        <li><strong>MCPサーバー:</strong> Claude等のAIアシスタントから直接操作可能</li>
                    </ul>
                    
                    <h3>使用例</h3>
                    <pre><code># ポートを取得または自動割り当て
portman get myapp
# Output: Assigned port 3000 to myapp

# 特定のポートを登録（既に使用中でもOK）
portman set myapp 3000
# ℹ️  Port 3000 is currently in use (node, PID: 12345)
# ✓ Assigned port 3000 to myapp

# 強制的に再割り当て
portman set myapp 3000 --force --yes

# プロジェクト初期化
portman init
# ✓ Initialized portman for project 'my-api' (node)
# ✓ Assigned port: 3001
# ✓ Created .portmanrc.yaml

# JSON出力（AI/スクリプト向け）
portman list --json</code></pre>
                    
                    <h3>設定ファイル形式</h3>
                    <pre><code># .portmanrc.yaml
project: my-api
port: 3000        # オプション：特定ポート指定
autoAssign: true  # オプション：自動割り当て
user: developer   # オプション：ユーザー固有設定</code></pre>
                </div>
            </details>
        </section>
        
        <section class="section">
            <h2>インストール方法</h2>
            
            <div class="platform-section">
                <h4>🍎 macOS</h4>
                <details>
                    <summary>Homebrewを使用（準備中）</summary>
                    <div class="details-content">
                        <pre><code>brew install portman</code></pre>
                    </div>
                </details>
                
                <details>
                    <summary>Go Installを使用</summary>
                    <div class="details-content">
                        <pre><code>go install github.com/daikurokawa/portman/cmd/portman@latest</code></pre>
                    </div>
                </details>
                
                <details open>
                    <summary>ソースからビルド</summary>
                    <div class="details-content">
                        <pre><code>git clone https://github.com/daikurokawa/portman.git
cd portman/portman-go
go build -o portman ./cmd/portman
sudo mv portman /usr/local/bin/</code></pre>
                    </div>
                </details>
            </div>
            
            <div class="platform-section">
                <h4>🐧 Linux (Intel/AMD)</h4>
                <details open>
                    <summary>ビルド済みバイナリ</summary>
                    <div class="details-content">
                        <pre><code># 最新版をダウンロード
wget https://github.com/daikurokawa/portman/releases/download/VERSION_PLACEHOLDER/portman-linux-amd64
chmod +x portman-linux-amd64
sudo mv portman-linux-amd64 /usr/local/bin/portman

# または install スクリプトを使用
wget https://github.com/daikurokawa/portman/releases/download/VERSION_PLACEHOLDER/portman-linux-amd64
wget https://github.com/daikurokawa/portman/releases/download/VERSION_PLACEHOLDER/install-linux.sh
chmod +x install-linux.sh
./install-linux.sh</code></pre>
                    </div>
                </details>
                
                <details>
                    <summary>ソースからビルド</summary>
                    <div class="details-content">
                        <pre><code>git clone https://github.com/daikurokawa/portman.git
cd portman/portman-go
go build -o portman ./cmd/portman
sudo mv portman /usr/local/bin/</code></pre>
                    </div>
                </details>
            </div>
            
            <div class="platform-section">
                <h4>🤖 AI Assistant (Claude, Cursor等)</h4>
                <details>
                    <summary>MCP Server設定</summary>
                    <div class="details-content">
                        <p>Claude Desktop の設定ファイル (<code>~/Library/Application Support/Claude/claude_desktop_config.json</code>) に追加:</p>
                        <pre><code>{
  "mcpServers": {
    "portman": {
      "command": "/Users/YOUR_USERNAME/.bin/portman-mcp",
      "env": {
        "PORTMAN_CONFIG": "/Users/YOUR_USERNAME/.portman/portman.yaml"
      }
    }
  }
}</code></pre>
                        <p>設定後、Claudeから直接ポート管理が可能になります。</p>
                    </div>
                </details>
            </div>
        </section>
        
        <section class="section">
            <h2>クイックスタート</h2>
            <pre><code># インストール確認
portman version

# プロジェクトを初期化
cd /path/to/your/project
portman init

# 割り当てられたポートで開発サーバーを起動
PORT=$(portman config --json | jq -r .port) npm start

# または exec コマンドを使用
portman exec --project myapp -- npm start</code></pre>
            
            <div class="warning">
                <strong>⚠️ 注意:</strong> Portmanはローカル開発環境向けのツールです。本番環境での使用は推奨されません。
            </div>
        </section>
        
        <section class="section">
            <h2>リンク</h2>
            <div class="install-options">
                <a href="https://github.com/daikurokawa/portman" class="install-btn">📦 GitHub</a>
                <a href="https://github.com/daikurokawa/portman/releases" class="install-btn">⬇️ Releases</a>
                <a href="https://github.com/daikurokawa/portman/blob/main/portman-go/README.md" class="install-btn">📚 Documentation</a>
            </div>
        </section>
    </div>
    
    <script>
        // Add smooth scroll behavior
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>
EOF

# Replace version placeholders
sed -i.bak "s/VERSION_PLACEHOLDER/${VERSION}/g" docs/instruction.html
rm docs/instruction.html.bak

echo "✅ Generated docs/instruction.html (version ${VERSION})"
echo "📄 File size: $(ls -lh docs/instruction.html | awk '{print $5}')"

# Copy to project root
cp docs/instruction.html ../../instruction.html
echo "✅ Copied to project root: $(cd ../.. && pwd)/instruction.html"