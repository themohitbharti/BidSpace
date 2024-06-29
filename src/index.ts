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

app.get("/", (req: any, res: any) => {
    res.send("Hello World!");
});

// Error Middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(port, () =>
  console.log("\x1b[36m%s\x1b[0m", `Server started on port ${port}`)
);
