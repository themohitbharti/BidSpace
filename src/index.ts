import dotenv from "dotenv"
import express from "express"
import { app } from "./app";

dotenv.config();

const port = process.env.PORT

app.get('/' , (req: any, res: any) => {
    res.send("kya hua jo lari chuti")
    console.log("kismat ki gaadi luti")
})

app.listen(port,()=>{
    console.log("Server is up and Running")
})