import express from "express";
import cors from "cors";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const app = express();
const execFileAsync = promisify(execFile);

const PORT = 3000;
const uploadDir = path.join(process.cwd(), "uploads");
const outputDir = path.join(process.env.HOME, "storage/music/VidBear");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "VidBear Backend Running" });
});

// Apni ya authorized video file ko MP3 mein convert karein
app.post("/api/convert-mp3", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Video file required" });
  }

  const outputName = `${Date.now()}.mp3`;
  const outputPath = path.join(outputDir, outputName);

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", req.file.path,
      "-vn",
      "-codec:a", "libmp3lame",
      "-q:a", "2",
      outputPath
    ]);

    res.json({
      success: true,
      message: "MP3 converted successfully",
      filename: outputName,
      savedTo: outputPath
    });
  } catch (error) {
    console.error(error.stderr || error.message);
    res.status(500).json({ error: "MP3 conversion failed" });
  } finally {
    fs.promises.unlink(req.file.path).catch(() => {});
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VidBear server running on port ${PORT}`);
});
