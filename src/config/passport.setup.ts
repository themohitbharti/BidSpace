import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { User, UserDocument } from "../models/user.models";

dotenv.config();

const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = process.env;

if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
  throw new Error("Missing required environment variables for Google OAuth");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: OAUTH_CLIENT_ID,
      clientSecret: OAUTH_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }

        let user = await User.findOne({ email });

        if (user) {
          // Update user with Google OAuth details if not already linked
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        } else {
          // Create a new user if no existing user found
          user = new User({
            googleId: profile.id,
            email,
            fullName: profile.displayName,
          });
          await user.save();
        }

        done(null, user);
      } catch (err) {
        done(err, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(undefined, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
