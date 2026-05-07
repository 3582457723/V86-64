const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: path.join(__dirname, "uploads") });

app.use(express.static(path.join(__dirname, "docs")));

app.post("/upload", upload.single("iso"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "ISO file is required." });
  }

  const filename = req.file.filename;
  const url = `/iso/${encodeURIComponent(filename)}`;
  res.json({ url, name: req.file.originalname });
});

app.get("/iso/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("ISO not found.");
  }
  res.sendFile(filePath);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs/index.html"));
});

app.listen(port, () => {
  console.log(`v86-64 web engine running at http://localhost:${port}`);
});
