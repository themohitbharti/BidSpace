import express from "express"
import cors from "cors";
import dotenv from "dotenv"

const app = express()

dotenv.config();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("trust proxy", 1);




export { app };