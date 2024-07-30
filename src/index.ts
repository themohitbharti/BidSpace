import dotenv from "dotenv";
import express from "express";
import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from "./app";
import connectDB from "./db/conn";

dotenv.config();
connectDB();

const port = process.env.PORT;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

io.on("connection" , (socket) => {
  console.log(`user connected ${socket.id}`)

  socket.on("message" , (message) => {
      console.log("message: ", message)

      io.emit("message" , message)
  })

  socket.on("disconnect" ,() => {
      console.log(`${socket.id} disconnected`)
  })
})

app.get("/", (req: any, res: any) => {
  res.send("nazro me ho tum meri");
  console.log("khona chahu mai raat bhar");
});

server.listen(port, () => {
  console.log(`Server is up and Running on port ${port}`);
});
