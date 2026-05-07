const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

const isoDirectory = path.join(__dirname, "iso");

// ISO ディレクトリ作成
if (!fs.existsSync(isoDirectory)) {
  fs.mkdirSync(isoDirectory, { recursive: true });
}

// 静的ファイル提供
app.use(express.static(path.join(__dirname, "public")));
app.use("/iso", express.static(isoDirectory));

// ISO一覧を返す
app.get("/isos", (req, res) => {
  fs.readdir(isoDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "ISO ディレクトリ読み込みエラー" });
    }
    
    const isoFiles = files
      .filter((file) => file.toLowerCase().endsWith(".iso"))
      .map((name) => ({
        name,
        path: `/iso/${encodeURIComponent(name)}`
      }));

    res.json({
      images: isoFiles,
      count: isoFiles.length,
      architectures: ["x86", "x86-64", "x32", "arm64"]
    });
  });
});

// ルートエンドポイント（デプロイ版を提供）
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index-deploy.html"));
});

// ヘルスチェック
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "v86-deploy" });
});

// サーバー起動
app.listen(port, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🖥️  V86 OS Virtual Environment Engine - Deploy Mode      ║
╠════════════════════════════════════════════════════════════╣
║  🌐 URL: http://localhost:${port}
║  📁 ISO Directory: ${isoDirectory}
║  ✓ Ready for deployment
╚════════════════════════════════════════════════════════════╝
  `);
});
