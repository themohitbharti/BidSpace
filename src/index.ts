import dotenv from "dotenv";
import express from "express";
import { app } from "./app";

dotenv.config();

const port = process.env.PORT;

// Log Middleware
app.use((req: any, res: any, next: any) => {
    console.log(`Request: ${req.method} ${req.path}`);
    next();
});

app.get("/ball", (req: any, res: any) => {
    res.send("Hello World!");
});

app.get("/lol", (req: any, res: any) => {
    res.send("H!");
});

app.get('/' , (req: any, res: any) => {
    res.send("kya hua jo lari chuti")
    console.log("kismat ki gaadi luti")
})

app.get('/login' , (req:any,res:any) => {
    res.send("user logined")
})
