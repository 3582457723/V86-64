# デプロイガイド - V86 マルチアーキテクチャエンジン

このドキュメントでは、V86仮想環境エンジンをデプロイする手順を説明します。

## 📦 デプロイ版の特徴

- ✅ **シンプルな UI** - OS選択と起動に特化
- ✅ **軽量サーバー** - 不要な機能を削除
- ✅ **本番対応** - エラーハンドリング完備
- ✅ **デバッグ情報** - ブラウザコンソールでログ閲覧可能

## 🚀 クイックスタート

### 1. 前提条件
- Node.js v18 以上
- npm

### 2. セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/3582457723/V86-64.git
cd V86-64

# 依存関係をインストール
npm install
```

### 3. ISO ファイルの配置

`iso/` フォルダに ISO ファイルを配置します。

```bash
# 例
iso/
├── ubuntu-26.04-desktop-amd64.iso
├── debian-13.4.0-amd64-netinst.iso
└── zorin-os-18.1-core-64-bit.iso
```

### 4. デプロイモードで起動

```bash
npm run deploy
```

ブラウザで `http://localhost:3000` にアクセスします。

## 🌍 本番環境へのデプロイ

### Heroku へのデプロイ

```bash
# Herokuにログイン
heroku login

# Herokuアプリを作成
heroku create your-app-name

# リモートリポジトリを追加
heroku git:remote -a your-app-name

# デプロイ
git push heroku main
```

### Railway へのデプロイ

1. [Railway.app](https://railway.app) にアクセス
2. GitHub リポジトリを接続
3. 環境変数を設定（下記参照）
4. デプロイ実行

### Cloudflare Pages + Workers

別途 API サーバー（Express）が必要です。詳細は各プラットフォームのドキュメントを参照。

## ⚙️ 環境変数

```bash
# ポート指定（デフォルト: 3000）
PORT=8080 npm run deploy

# ホストを指定（デフォルト: 0.0.0.0）
HOST=0.0.0.0 npm run deploy
```

## 📋 API リファレンス

### GET /isos
利用可能な ISO ファイル一覧を返す

**レスポンス例:**
```json
{
  "images": [
    {
      "name": "ubuntu-26.04-desktop-amd64.iso",
      "path": "/iso/ubuntu-26.04-desktop-amd64.iso"
    }
  ],
  "count": 1,
  "architectures": ["x86", "x86-64", "x32", "arm64"]
}
```

### GET /health
サーバーヘルスチェック

**レスポンス:**
```json
{
  "status": "ok",
  "service": "v86-deploy"
}
```

## 🐳 Docker でのデプロイ

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "deploy"]
```

### ビルド & 実行

```bash
# ビルド
docker build -t v86-engine .

# 実行
docker run -p 3000:3000 \
  -v $(pwd)/iso:/app/iso \
  v86-engine
```

### Docker Compose

```yaml
version: '3.8'

services:
  v86:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./iso:/app/iso
    environment:
      - PORT=3000
```

実行:
```bash
docker-compose up
```

## 🔧 トラブルシューティング

### ISO が表示されない
1. `iso/` ディレクトリに `.iso` ファイルがあるか確認
2. ファイルの読み取り権限を確認: `chmod 644 iso/*.iso`
3. ファイル名に日本語が含まれていないか確認

### ポート 3000 が使用中
```bash
# 別のポートで起動
PORT=8080 npm run deploy
```

### V86 ライブラリが読み込まれない
1. インターネット接続を確認（CDN へのアクセス）
2. ブラウザのコンソール（F12）でエラーメッセージを確認
3. ファイアウォール/プロキシ設定を確認

## 📊 パフォーマンスチューニング

### メモリ最適化
```javascript
// server-deploy.js での設定
// デフォルト: 512MB （推奨）
memorySelect.value = "512"
```

### CPU 設定
```javascript
// 1～4 コア推奨（ブラウザのスレッド制限のため）
cpuSelect.value = "2"
```

## 🔒 セキュリティに関する注意

この実装は **教育・デモ目的** です。本番環境では以下を追加してください：

1. **レート制限**
```javascript
const rateLimit = require("express-rate-limit");
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));
```

2. **HTTPS**
- Let's Encrypt で SSL 証明書を取得
- リバースプロキシ（Nginx など）で HTTPS 終端

3. **認証**
- ユーザー認証を追加
- API キーでアクセス制御

4. **ロギング**
- 詳細なアクセスログ記録
- エラー監視（Sentry など）

## 📞 サポート

問題が発生した場合：

1. [GitHub Issues](https://github.com/3582457723/V86-64/issues) で報告
2. ブラウザコンソール（F12）のエラーメッセージを記録
3. サーバーログを確認

## 📄 ライセンス

MIT License

---

**最終更新:** 2026年5月7日
