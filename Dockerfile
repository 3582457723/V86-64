FROM node:20-alpine

WORKDIR /app

# パッケージをコピーしてインストール
COPY package*.json ./
RUN npm install --production

# アプリケーションファイルをコピー
COPY server-deploy.js ./
COPY public ./public

# ISO ディレクトリを作成
RUN mkdir -p iso

# ボリュームマウント用
VOLUME ["/app/iso"]

# ポート公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# デプロイモードで起動
CMD ["node", "server-deploy.js"]
