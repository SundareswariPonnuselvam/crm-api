import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import errorHandler from "./middleware/error.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import "./config/passport.js"; // Import passport configuration

const app = express();

// Middleware
app.use(
  cors({
      origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Ensure SESSION_SECRET is defined
if (!process.env.SESSION_SECRET) {
  console.error("Error: SESSION_SECRET is not defined in the environment variables.");
  process.exit(1); // Exit the application
}

// Session middleware (required for OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // Fallback to a default secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
