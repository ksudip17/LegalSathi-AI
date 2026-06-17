import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const fullName = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile."), null);
        }

        // ── Check if user already exists with this Google ID ──
        let user = await User.findOne({ googleId });

        if (user) {
          // Update last login and avatar
          user.lastLogin = new Date();
          user.avatar = avatar || user.avatar;
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // ── Check if user exists with same email (local account) ──
        user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link Google to existing local account
          user.googleId = googleId;
          user.avatar = avatar || user.avatar;
          user.authProvider = "google";
          user.lastLogin = new Date();
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // ── Create new user with Google account ──
        user = await User.create({
          fullName,
          email: email.toLowerCase(),
          googleId,
          avatar,
          authProvider: "google",
          lastLogin: new Date(),
        });

        return done(null, user);

      } catch (error) {
        console.error(` Google OAuth error: ${error.message}`);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;