import dotenv from "dotenv"
import express from "express"
import { app } from "./app";
import connectDB from "./db/conn";

dotenv.config();
connectDB();

const port = process.env.PORT

app.get('/' , (req: any, res: any) => {
    res.send("nazro me ho tum meri")
    console.log("khona chahu mai raat bhar")
})

app.listen(port,()=>{
    console.log("Server is up and Running")
})