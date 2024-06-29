import express from "express"
import cors from "cors";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import logger from "morgan";
import passport from 'passport';
import session from "express-session";
import rateLimit from "express-rate-limit";
import userRoutes from "./routers/user.routes";
import authRoutes from "./routers/auth.routes"
import "./config/passport.setup"

const app = express()

dotenv.config();

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 2500, // limit each IP to 2500 requests per windowMs
  });

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(logger("dev"));
app.use(limiter);
app.set("trust proxy", 1);

const { SESSION_SECRET } = process.env;

if (!SESSION_SECRET) {
  throw new Error('Missing required environment variables for session initialization');
}

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Ensure cookies are used only over HTTPS in production
    }
}));

app.use(passport.initialize());
app.use(passport.session());


app.use("/api/v1/user", userRoutes);
app.use("/auth", authRoutes);


export { app };