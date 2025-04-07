import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../middleware/async.js";
import ErrorResponse from "../utils/errorResponse.js";
import passport from "passport";
import dotenv from "dotenv";
dotenv.config();

export const handleOAuthSuccess = async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL}/oauth-error?error=no_user`);
  }

  try {
    if (!req.user.email) {
      throw new Error("No email found");
    }
    const user = req.user;
    const token = generateToken(req.user);
    res.redirect(
      `${
        process.env.CLIENT_URL
      }/oauth-success?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        })
      )}`
    );
  } catch (error) {
    res.redirect(
      `${
        process.env.CLIENT_URL
      }/oauth-error?error=no_email&message=${encodeURIComponent(error.message)}`
    );
  }
};

export const handleOAuthFailure = (req, res) => {
  res.redirect(
    `${process.env.CLIENT_URL}/oauth-error?message=Authentication%20failed`
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    OAuth callback
// @route   GET /api/auth/callback
// @access  Private
// Modify the oauthCallback function
export const oauthCallback = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse("OAuth authentication failed", 401));
  }

  // Generate token
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Instead of sending JSON response, redirect to frontend with token and role
  const redirectUrl = `${process.env.CLIENT_URL}?token=${token}&role=${req.user.role}`;

  // Set cookie as before
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.cookie("token", token, options);

  // Redirect to frontend with query params
  return res.redirect(redirectUrl);
});

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
// @access  Public
export const googleOAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleOAuthCallback = passport.authenticate("google", {
  failureRedirect: "/login",
  session: false,
});

// @desc    Initiate GitHub OAuth
// @route   GET /api/auth/github
// @access  Public
export const githubOAuth = passport.authenticate("github", {
  scope: ["user:email"],
});

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
// @access  Public
export const githubOAuthCallback = passport.authenticate("github", {
  failureRedirect: "/login",
  session: false,
});

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

// Other existing controller methods (getMe, logout) remain the same

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// OAuth Success Handler
export const oauthSuccess = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  const token = generateToken(req.user);
  const userData = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };

  // Redirect to frontend with token in URL
  res.redirect(
    `${
      process.env.CLIENT_URL
    }/oauth-callback?token=${token}&user=${encodeURIComponent(
      JSON.stringify(userData)
    )}`
  );
});

// OAuth Failure Handler
export const oauthFailure = asyncHandler(async (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
});
