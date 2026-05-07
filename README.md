# マルチアーキテクチャOS仮想環境エンジン
x86/x86-64/x32/ARM64対応 - ブラウザ上でOSを実行

## 概要
このリポジトリは、V86 JavaScript エミュレータをベースにした、複数のアーキテクチャをサポートするWeb仮想環境エンジンです。ブラウザからISO イメージをアップロードして、さまざまなOS環境を実行できます。

## サポートアーキテクチャ
- **x86** (32-bit i386)
- **x86-64** (AMD64/Intel 64-bit) 
- **x32** (32-bit address space on x64)
- **ARM64** (AArch64)

## 主な機能
✅ **ブラウザベースの仮想化** - インストール不要、どこからでもアクセス可能
✅ **ISOアップロード機能** - サーバー側のisoフォルダからファイルを選択可能
✅ **自動アーキテクチャ検出** - ファイル名からアーキテクチャを自動判定
✅ **柔軟なリソース設定** - メモリ（128MB～8GB）とCPUコア数（1～8）をカスタマイズ
✅ **リアルタイムログ出力** - エミュレータのコンソール出力をリアルタイム表示

## セットアップ

### 前提条件
- Node.js v18 以上
- npm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/3582457723/V86-64.git
cd V86-64

# 依存パッケージをインストール
npm install
```

### サーバー起動

```bash
npm start
```

サーバーは `http://localhost:3000` で起動します。

## 使い方

### ローカル環境

1. サーバーを起動後、ブラウザで `http://localhost:3000` を開く
2. ISOファイルをアップロードするか、既存のISOを選択
3. アーキテクチャ、メモリ、CPU数を設定
4. **起動** ボタンをクリック
5. ブラウザ内の仮想環境でOSが起動

### ISOファイルの配置

#### 方法1: フォルダに直接配置
リポジトリルートの `iso/` フォルダに ISO ファイルを配置してください。例:
```
iso/
  └── debian-13.4.0-amd64-netinst.iso
  └── ubuntu-26.04-desktop-amd64.iso
```

#### 方法2: ブラウザからアップロード
**ISO ファイル管理** セクションでファイルを選択して **アップロード** ボタンをクリック。

## API リファレンス

### GET /isos
利用可能なISOファイルとサポートアーキテクチャを取得

**レスポンス例:**
```json
{
  "images": [
    {
      "name": "ubuntu-26.04-desktop-amd64.iso",
      "path": "/iso/ubuntu-26.04-desktop-amd64.iso"
    }
  ],
  "architectures": ["x86", "x86-64", "x32", "arm64"]
}
```

### POST /upload-iso
ISOファイルをアップロード (multipart form-data)

**パラメータ:**
- `file`: ISOファイル (最大 2GB)

**レスポンス例:**
```json
{
  "message": "ISOファイルがアップロードされました",
  "filename": "ubuntu-26.04-desktop-amd64.iso",
  "architecture": "x86-64",
  "size": 4294967296
}
```

## ディレクトリ構成

```
V86-64/
├── server.js              # Express サーバー
├── package.json           # npm 設定
├── README.md              # このファイル
├── iso/                   # ISO ファイル置き場
├── uploads/               # アップロード一時ディレクトリ
├── public/                # クライアント側アセット
│   ├── index.html         # UIテンプレート
│   ├── app.js             # クライアントロジック
│   └── styles.css         # スタイルシート
└── docs/                  # GitHub Pages 用（静的公開）
```

## トラブルシューティング

### ポート3000が既に使用中
```bash
# 別のポートで起動
PORT=3001 npm start
```

### ISOが読み込まれない
1. ファイル名を確認（拡張子が `.iso` であることを確認）
2. ファイルサイズが 2GB 以下であることを確認
3. ブラウザのコンソール（F12）でエラーメッセージを確認

### 仮想環境が起動しない
1. ブラウザがWebAssemblyをサポートしているか確認
2. ネットワークが CDN (cdn.jsdelivr.net) にアクセスできることを確認
3. メモリサイズを小さくしてみる（512MB 推奨）

## 対応ブラウザ

- Chrome/Chromium 57+
- Firefox 52+
- Safari 11.1+
- Edge 79+

## ライセンス

MIT License

## 参考リンク

- [V86 プロジェクト](https://github.com/copy/v86)
- [WebAssembly 公式ドキュメント](https://webassembly.org/)

---

**注意**: 本リポジトリのエミュレータはWebAssemblyベースであり、完全な性能を発揮します。ただし、本格的な開発にはネイティブ仮想化ツール（VirtualBox、KVM等）の使用を推奨します。
