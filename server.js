const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

const isoDirectory = path.join(__dirname, "iso");

app.use(express.static(path.join(__dirname, "docs")));
app.use("/iso", express.static(isoDirectory));

app.get("/isos", (req, res) => {
  fs.readdir(isoDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read ISO directory." });
    }
    const isoFiles = files.filter((file) => file.toLowerCase().endsWith(".iso"));
    res.json({ images: isoFiles });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs/index.html"));
});

app.listen(port, () => {
  console.log(`v86-64 web engine running at http://localhost:${port}`);
});
