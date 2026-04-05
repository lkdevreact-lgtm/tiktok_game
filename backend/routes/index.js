import express from "express";
import { handleConnect, handleDisconnect } from "../controllers/connectController.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve gift data
router.get("/gifts", (req, res) => {
  try {
    const giftsPath = join(__dirname, "../data/gifts.json");
    const gifts = JSON.parse(readFileSync(giftsPath, "utf8"));
    res.json(gifts);
  } catch (err) {
    res.status(500).json({ error: "Could not read gifts data" });
  }
});

// TikTok connection
router.post("/connect", handleConnect);
router.post("/disconnect", handleDisconnect);

export default router;
