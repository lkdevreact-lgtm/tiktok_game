import express from "express";
import { handleConnect, handleDisconnect } from "../controllers/connectController.js";
import {
  getModels,
  uploadModel,
  updateModel,
  deleteModel,
  uploadModelIcon,
  uploadModelWithIcon,
  uploadIcon,
  replaceModelGLB,
  upload,
} from "../controllers/modelController.js";
import { getGifts, updateGift } from "../controllers/giftController.js";
import { getTriggers, saveTriggers } from "../controllers/triggerController.js";
import { ttsSpeak, ttsTestFormats, ttsVoices } from "../controllers/ttsController.js";

const router = express.Router();

// ── Gifts ──────────────────────────────────────────────────────
router.get("/gifts", getGifts);
router.put("/gifts/:giftId", updateGift);

// ── TikTok connection ─────────────────────────────────────────
router.post("/connect", handleConnect);
router.post("/disconnect", handleDisconnect);

// ── Models CRUD ───────────────────────────────────────────────
router.get("/models", getModels);
// Upload GLB + optional icon image in one request
router.post(
  "/models/upload",
  uploadModelWithIcon.fields([
    { name: "file",      maxCount: 1 },
    { name: "iconImage", maxCount: 1 },
  ]),
  uploadModel,
);
// Replace GLB file for existing model
router.post("/models/:id/glb",  upload.single("file"), replaceModelGLB);
// Upload / replace icon for an existing model
router.post("/models/:id/icon", uploadIcon.single("iconImage"), uploadModelIcon);
router.put("/models/:id", updateModel);
router.delete("/models/:id", deleteModel);

// ── Triggers ──────────────────────────────────────────────────
router.get("/triggers", getTriggers);
router.put("/triggers", saveTriggers);

// ── TTS Proxy ─────────────────────────────────────────────────
router.post("/tts/speak", ttsSpeak);
router.post("/tts/test-formats", ttsTestFormats);
router.get("/tts/voices", ttsVoices);

export default router;


