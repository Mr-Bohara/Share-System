import express from "express";
import path from "path";
import https from "https";
import http from "http";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";

// Ensure the local upload directory exists under /tmp (which is memory-backed and ultra-fast in Cloud Run)
const UPLOAD_DIR = "/tmp/uploads";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure standard disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const fileId = (req.headers["x-file-id"] as string) || `file_${Date.now()}`;
    cb(null, fileId);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB limit
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Custom high-speed direct upload endpoint
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileId = (req.headers["x-file-id"] as string) || req.file.filename;
    console.log(`[HighSpeedUpload] Saved file ${req.file.originalname} as ${fileId} in UPLOAD_DIR.`);

    // Store filename mapping to serve it properly on download
    const metaPath = path.join(UPLOAD_DIR, `${fileId}.meta`);
    fs.writeFileSync(
      metaPath,
      JSON.stringify({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      })
    );

    res.json({
      success: true,
      fileId: fileId,
      filename: req.file.originalname,
      size: req.file.size,
      downloadUrl: `/api/files/download/${fileId}`
    });
  });

  // Custom high-speed direct download endpoint
  app.get("/api/files/download/:fileId", (req, res) => {
    const fileId = req.params.fileId;
    const filePath = path.join(UPLOAD_DIR, fileId);
    const metaPath = path.join(UPLOAD_DIR, `${fileId}.meta`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found or expired.");
    }

    let originalname = "download";
    let mimetype = "application/octet-stream";

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        originalname = meta.originalname;
        mimetype = meta.mimetype;
      } catch (e) {
        console.error("[Download] Error reading file meta:", e);
      }
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(originalname)}"`
    );
    res.setHeader("Content-Type", mimetype);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // Delete a local file from disk
  app.delete("/api/files/delete/:fileId", (req, res) => {
    const fileId = req.params.fileId;
    const filePath = path.join(UPLOAD_DIR, fileId);
    const metaPath = path.join(UPLOAD_DIR, `${fileId}.meta`);

    console.log(`[Delete] Request to delete local file: ${fileId}`);
    
    let deleted = false;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deleted = true;
      } catch (err) {
        console.error(`[Delete] Error deleting file ${fileId}:`, err);
      }
    }

    if (fs.existsSync(metaPath)) {
      try {
        fs.unlinkSync(metaPath);
      } catch (err) {
        console.error(`[Delete] Error deleting meta ${fileId}:`, err);
      }
    }

    res.json({ success: true, deleted });
  });

  // Clear all local files from disk (purge)
  app.post("/api/files/clear", (req, res) => {
    console.log("[Clear] Purging all files in local upload directory.");
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      let count = 0;
      for (const file of files) {
        const filePath = path.join(UPLOAD_DIR, file);
        fs.unlinkSync(filePath);
        count++;
      }
      res.json({ success: true, count });
    } catch (err) {
      console.error("[Clear] Error clearing local upload directory:", err);
      res.status(500).json({ error: "Failed to clear directory" });
    }
  });

  // Direct download proxy to bypass CORS and prevent external landing page navigation
  app.get("/api/download", (req, res) => {
    const fileUrl = req.query.url as string;
    const filename = req.query.filename as string;

    if (!fileUrl) {
      return res.status(400).send("Missing file URL.");
    }

    // If it's already a local direct download URL, redirect or stream it
    if (fileUrl.startsWith("/api/files/download/")) {
      const fileId = fileUrl.split("/").pop();
      return res.redirect(`/api/files/download/${fileId}`);
    }

    console.log(`[Proxy] Downloading file from URL: ${fileUrl} for file: ${filename}`);

    const client = fileUrl.startsWith("https") ? https : http;

    client.get(fileUrl, (sourceRes) => {
      if (sourceRes.statusCode && sourceRes.statusCode >= 400) {
        console.error(`[Proxy] Source returned error status: ${sourceRes.statusCode}`);
        return res.status(sourceRes.statusCode).send(`Error fetching file: ${sourceRes.statusMessage}`);
      }

      // Configure attachment headers to force immediate direct browser download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename || "download")}"`
      );
      if (sourceRes.headers["content-type"]) {
        res.setHeader("Content-Type", sourceRes.headers["content-type"]);
      }
      if (sourceRes.headers["content-length"]) {
        res.setHeader("Content-Length", sourceRes.headers["content-length"]);
      }

      sourceRes.pipe(res);
    }).on("error", (err) => {
      console.error("[Proxy] Download pipeline error:", err);
      res.status(500).send("Failed to retrieve file from storage.");
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
