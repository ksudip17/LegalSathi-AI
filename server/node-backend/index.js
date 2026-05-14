import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import passport from "./utils/passport.js";
import xss from "xss";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import legalRoutes from "./routes/legalRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Trust Render Proxy ───────────────────────────────────────
app.set("trust proxy", 1);

// ─── Security Middleware ──────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "https://legalsaathi-ai.vercel.app",
  "https://legalsaathi.mooo.com",
  process.env.CLIENT_URL,
].filter(Boolean).map((origin) => origin.replace(/\/$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Handle preflight request
// Handle preflight manually
app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, "");
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});


// ─── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 100 : 20,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── General Middleware ───────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// ─── Passport ────────────────────────────────────────────────
app.use(passport.initialize());

// ─── XSS + NoSQL Injection Protection ────────────────────────
app.use((req, res, next) => {
  const sanitize = (value) => {
    if (typeof value === "string") {
      let clean = xss(value);
      clean = clean.replace(/\$\./g, "");
      return clean;
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const cleaned = {};
      for (const key in value) {
        const cleanKey = key.replace(/^\$/, "_");
        cleaned[cleanKey] = sanitize(value[key]);
      }
      return cleaned;
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    return value;
  };

  if (req.body) req.body = sanitize(req.body);
  next();
});

// ─── MongoDB Connection ───────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/legal", legalRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LegalSaathi API is running 🇳🇵",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      documents: "/api/documents",
      legal: "/api/legal",
    },
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "LegalSaathi API is running 🇳🇵",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      documents: "/api/documents",
      legal: "/api/legal",
    },
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);

  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS: Origin not allowed.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 LegalSaathi Backend running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🛡️  Security: XSS + NoSQL injection protection enabled`);
    console.log(`🔐 Google OAuth: enabled`);
    console.log(`🌐 Allowed Origins: ${allowedOrigins.join(", ")}`);
  });
};

start();