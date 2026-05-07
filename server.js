const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const app = express();
const port = process.env.PORT || 3000;

const isoDirectory = path.join(__dirname, "iso");
const uploadDirectory = path.join(__dirname, "uploads");

// ディレクトリ作成
if (!fs.existsSync(isoDirectory)) {
  fs.mkdirSync(isoDirectory, { recursive: true });
}
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Multer設定
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/octet-stream" || file.originalname.endsWith(".iso")) {
      cb(null, true);
    } else {
      cb(new Error("ISOファイルのみアップロード可能です"));
    }
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/iso", express.static(isoDirectory));
app.use("/uploads", express.static(uploadDirectory));

// 非同期でISOファイルのアーキテクチャを検出（簡易版）
function detectArchitecture(buffer) {
  // x86-64: 0x8664, i386: 0x014c, ARM64: 0xaa64
  const dosHeader = buffer.readUInt32LE(0x3c);
  if (dosHeader > buffer.length - 4) return "x86";
  const peSignature = buffer.readUInt32LE(dosHeader);
  if (peSignature !== 0x4550) return "x86";
  const machine = buffer.readUInt16LE(dosHeader + 4);
  if (machine === 0x8664) return "x86-64";
  if (machine === 0x014c) return "x86";
  if (machine === 0xaa64) return "arm64";
  return "x86";
}

app.get("/isos", (req, res) => {
  fs.readdir(isoDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read ISO directory." });
    }
    const isoFiles = files
      .filter((file) => file.toLowerCase().endsWith(".iso"))
      .map((name) => ({ name, path: `/iso/${name}` }));
    res.json({
      images: isoFiles,
      architectures: ["x86", "x86-64", "x32", "arm64"]
    });
  });
});

app.post("/upload-iso", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "ファイルがアップロードされていません" });
  }

  const originalName = req.file.originalname;
  const finalPath = path.join(isoDirectory, originalName);

  fs.rename(req.file.path, finalPath, (err) => {
    if (err) {
      console.error("File rename error:", err);
      return res.status(500).json({ error: "ファイルの保存に失敗しました" });
    }
    
    fs.readFile(finalPath, (err, buffer) => {
      const arch = !err ? detectArchitecture(buffer) : "x86";
      res.json({
        message: "ISOファイルがアップロードされました",
        filename: originalName,
        architecture: arch,
        size: req.file.size
      });
    });
  });
});

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "ファイルサイズが大きすぎます（最大2GB）" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error("Upload error:", err);
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(port, () => {
  console.log(`v86 マルチアーキテクチャエンジン running at http://localhost:${port}`);
  console.log(`サポートアーキテクチャ: x86, x86-64, x32, arm64`);
});
