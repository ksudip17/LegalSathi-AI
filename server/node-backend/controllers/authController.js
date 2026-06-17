import User from "../models/User.js";
import jwt from "jsonwebtoken";

// ─── Generate Token ───────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── Cookie Options ───────────────────────────────────────────
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Register ─────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({ fullName, email, phone, password });
    const token = generateToken(user._id);

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Welcome to LegalSaathi!",
      token,
      user: user.toPublicJSON(),
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    console.error(` Register error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

// ─── Login ────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Block Google-only users from password login
    if (user.authProvider === "google" && !user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google Sign In. Please login with Google.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Contact support.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful. Welcome back!",
      token,
      user: user.toPublicJSON(),
    });

  } catch (error) {
    console.error(` Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// ─── Google OAuth Callback ────────────────────────────────────
export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=google_failed`
      );
    }

    const token = generateToken(user._id);

    // Set cookie for same-domain
    res.cookie("token", token, cookieOptions);

    // Also pass token in URL for cross-domain (production)
    const userInfo = encodeURIComponent(JSON.stringify({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
    }));

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard?auth=google&token=${token}&user=${userInfo}`
    );

  } catch (error) {
    console.error(` Google callback error: ${error.message}`);
    return res.redirect(
      `${process.env.CLIENT_URL}/login?error=google_failed`
    );
  }
};

// ─── Logout ───────────────────────────────────────────────────
export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie("user_info", "", {
    httpOnly: false,
    expires: new Date(0),
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

// ─── Get Me ───────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    return res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error(` GetMe error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
    });
  }
};

// ─── Update Profile ───────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, preferredLanguage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: user.toPublicJSON(),
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error(` UpdateProfile error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Profile update failed.",
    });
  }
};

// ─── Change Password ──────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    // Block Google users from changing password
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        success: false,
        message: "Google accounts cannot change password here.",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      token,
    });

  } catch (error) {
    console.error(` ChangePassword error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Password change failed.",
    });
  }
};