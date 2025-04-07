import express from "express";
import passport from "passport";
import {
  register,
  login,
  getMe,
  logout,
  handleOAuthSuccess,
  handleOAuthFailure,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Local authentication
router.post("/register", register);
router.post("/login", login);

router.get('/verify-token', protect, (req, res) => {
  res.status(200).json({ success: true });
});

// OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/failure",
    session: false,
  }),
  handleOAuthSuccess
);

// Initiate GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

// GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/api/auth/failure",
    session: false,
  }),
  handleOAuthSuccess
);

// Failure route
router.get("/failure", handleOAuthFailure);

// Common routes
router.get("/me", protect, getMe);
router.get("/logout", logout);

export default router;
