import express from "express";
import {
  askLegalQuestion,
  getRightsByCategory,
  searchLegalCorpus,
  getLegalCategories,
  checkLegalStatement,
} from "../controllers/legalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All legal routes require authentication
router.use(protect);

// ─── Legal Routes ─────────────────────────────────────────────
router.get("/categories", getLegalCategories);
router.post("/ask", askLegalQuestion);
router.post("/rights", getRightsByCategory);
router.post("/search", searchLegalCorpus);
router.post("/check", checkLegalStatement);  // ← new

export default router;