# About to V86-64
An upgraded version of the V86 project that allows web browsers to run on 16-bit to 64-bit OS environments.

## Web仮想環境エンジン
このリポジトリは、ブラウザ上で動作する `v86` ベースの仮想環境エンジンです。アップロードした ISO イメージから x86-64 OS を起動できます。

## GitHub Pages セットアップ
このリポジトリは `docs/` フォルダを GitHub Pages の公開ソースとして使用します。

ただし、ISO アップロードとサーバー側での ISO 提供機能は静的ホスティングだけでは動作しません。
GitHub Pages で公開する場合は、別途 Express サーバーをホスティングする必要があります。

1. リポジトリを GitHub にプッシュします。
2. GitHub のリポジトリ設定で `Pages` セクションを開きます。
3. ソースを `main` ブランチの `docs` フォルダに設定します。
4. 公開 URL にアクセスして、静的なフロントエンドを確認します。

> 例: `https://<GitHubユーザー名>.github.io/V86-64/`

## 使い方（ローカル開発）
1. リポジトリをクローンします。
2. 依存関係をインストールします。

```bash
npm install
```

3. サーバーを起動します。

```bash
npm start
```

4. ブラウザで `http://localhost:3000` を開き、ISO ファイルをアップロードして起動します。

## 機能
- ISO アップロードによる仮想 CD-ROM 起動
- x86-64 モードの切り替え
- メモリサイズの調整
- エミュレータ画面表示とログ出力
- GitHub Pages 上での静的公開対応
