import express from "express";
import passport from "../utils/passport.js";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  googleAuthCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Local Auth Routes ────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ─── Google OAuth Routes ──────────────────────────────────────

// Step 1 — Redirect user to Google login page
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Step 2 — Google redirects back here after login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  googleAuthCallback
);

// ─── Protected Routes ─────────────────────────────────────────
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;