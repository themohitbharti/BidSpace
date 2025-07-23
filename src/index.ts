import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { app } from "./app";
import connectDB from "./db/conn";
import { joinAuctionRoom } from "./controllers/auction.controllers";
import { User } from "./models/user.models";
import "./types/socket"; // Import to register the module augmentation
import mongoose, { Schema } from "mongoose";

dotenv.config();
connectDB();

const port = process.env.PORT;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Middleware for socket authentication
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET ?? ""
    ) as { _id: string };
    const user = await User.findById(decodedToken._id);

    if (!user) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const userId = user._id as mongoose.Schema.Types.ObjectId;

    socket.userId = userId.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}, User ID: ${socket.userId}`);

  // Join user-specific room for notifications
  socket.join(`user:${socket.userId}`);
  console.log(
    `User ${socket.userId} joined notification room: user:${socket.userId}`
  );

  // Send acknowledgment to client
  socket.emit("connected", {
    message: "Successfully connected to notification system",
    userId: socket.userId,
  });

  socket.on("joinAuctionRoom", (auctionId) => {
    joinAuctionRoom(socket, auctionId);
    console.log(`User ${socket.id} joined auction room ${auctionId}`);
  });

  socket.on("leaveAuction", (auctionId) => {
    socket.leave(`auction:${auctionId}`);
    console.log(`User ${socket.id} left auction room auction:${auctionId}`);
  });

  socket.on("message", (message) => {
    console.log("message: ", message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} (${socket.id}) disconnected`);
  });
});

app.get("/", (req: any, res: any) => {
  res.send("nazro me ho tum meri, dil me bhi ho");
  console.log("khona chahu mai raat bhar");
});

server.listen(port, () => {
  console.log(`Server is up and Running on port ${port}`);
});

export { io };
