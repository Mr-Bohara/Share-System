import express from "express";
import path from "path";
import https from "https";
import http from "http";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Direct download proxy to bypass CORS and prevent external landing page navigation
  app.get("/api/download", (req, res) => {
    const fileUrl = req.query.url as string;
    const filename = req.query.filename as string;

    if (!fileUrl) {
      return res.status(400).send("Missing file URL.");
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
