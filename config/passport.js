import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

// Common OAuth user handling
const handleOAuthUser = async (profile, provider) => {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error("No email found");

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.displayName || profile.username,
      email,
      oauthProvider: provider,
      oauthId: profile.id,
      verified: true,
    });
  }

  return user;
};

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? `${process.env.BACKEND_URL}/api/auth/google/callback`
          : "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await handleOAuthUser(profile, "google");
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? `${process.env.BACKEND_URL}/api/auth/github/callback`
          : "http://localhost:5000/api/auth/github/callback",
      scope: ["user:email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // First try to get primary email
        let email = profile.emails?.[0]?.value;

        // If no email in profile, fetch via GitHub API
        if (!email) {
          const res = await axios.get("https://api.github.com/user/emails", {
            headers: { Authorization: `token ${accessToken}` },
          });
          const primaryEmail = res.data.find((e) => e.primary)?.email;
          if (!primaryEmail) throw new Error("No email available");
          email = primaryEmail;
        }

        // Rest of your user handling logic
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email,
            oauthProvider: "github",
            oauthId: profile.id,
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
