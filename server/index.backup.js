
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/check", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: "Video link required"
    });
  }

  try {
    const link = new URL(url);

    if (!["http:", "https:"].includes(link.protocol)) {
      throw new Error("Invalid URL");
    }

    res.json({
      success: true,
      message: "Link received successfully",
      url: link.href
    });

  } catch (error) {
    res.status(400).json({
      error: "Invalid video link"
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("VidBear server running on port 3000");
});

