import express from "express";
import cors from "cors";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const app = express();
const execFileAsync = promisify(execFile);

const PORT = process.env.PORT || 10000;
const uploadDir = path.join(os.tmpdir(), "vidbear-uploads");

fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VidBear Cloud Backend Running"
  });
});

app.post("/api/convert-mp3", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Video file required"
    });
  }

  const outputPath = path.join(
    uploadDir,
    `${crypto.randomUUID()}.mp3`
  );

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", req.file.path,
      "-vn",
      "-codec:a", "libmp3lame",
      "-q:a", "2",
      outputPath
    ], {
      timeout: 10 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024
    });

    res.download(outputPath, "VidBear.mp3", (error) => {
      fs.promises.unlink(req.file.path).catch(() => {});
      fs.promises.unlink(outputPath).catch(() => {});

      if (error) {
        console.error("Download error:", error.message);
      }
    });

  } catch (error) {
    console.error(error.stderr || error.message);

    fs.promises.unlink(req.file.path).catch(() => {});
    fs.promises.unlink(outputPath).catch(() => {});

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "MP3 conversion failed"
      });
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VidBear Cloud Backend running on port ${PORT}`);
});
