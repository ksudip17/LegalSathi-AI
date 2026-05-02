import express from "express";
import {
  analyzeDocument,
  getUserDocuments,
  getDocumentById,
  deleteDocument,
  retryAnalysis,
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { handleUploadError } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All document routes require authentication
router.use(protect);

// ─── Document Routes ──────────────────────────────────────────

// POST /api/documents/analyze — upload + analyze document
router.post("/analyze", handleUploadError, analyzeDocument);

// GET /api/documents — get all user documents (with pagination + filters)
router.get("/", getUserDocuments);

// GET /api/documents/:id — get single document
router.get("/:id", getDocumentById);

// DELETE /api/documents/:id — delete document
router.delete("/:id", deleteDocument);

// POST /api/documents/:id/retry — retry failed analysis
router.post("/:id/retry", retryAnalysis);

export default router;