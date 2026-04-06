import express from "express";
import { handleConnect, handleDisconnect } from "../controllers/connectController.js";
import {
  getModels,
  uploadModel,
  updateModel,
  deleteModel,
  upload,
} from "../controllers/modelController.js";
import { getGifts, updateGift } from "../controllers/giftController.js";

const router = express.Router();

// ── Gifts ──────────────────────────────────────────────────────
router.get("/gifts", getGifts);
router.put("/gifts/:giftId", updateGift);

// ── TikTok connection ─────────────────────────────────────────
router.post("/connect", handleConnect);
router.post("/disconnect", handleDisconnect);

// ── Models CRUD ───────────────────────────────────────────────
router.get("/models", getModels);
router.post("/models/upload", upload.single("file"), uploadModel);
router.put("/models/:id", updateModel);
router.delete("/models/:id", deleteModel);

export default router;
