import moment from "moment";
import { io } from "../index";
import { redisClient } from "../config/redisClient";
import { ObjectId, Types } from "mongoose";
import crypto from "crypto";

interface NotificationData {
  id: string; // Add unique ID
  userId: ObjectId | Types.ObjectId;
  auctionId: ObjectId | Types.ObjectId;
  productId: ObjectId | Types.ObjectId;
  message: string;
  time: Date;
  type?: "bid" | "auction_end" | "refund" | "purchase" | "general";
  read?: boolean;
  readAt?: Date;
}

const createNotification = async (
  userId: ObjectId | Types.ObjectId,
  message: string,
  auctionId: ObjectId | Types.ObjectId,
  productId: ObjectId | Types.ObjectId,
  type: "bid" | "auction_end" | "refund" | "purchase" | "general" = "general"
) => {
  try {
    const time = moment().toDate();
    const notificationId = crypto.randomUUID(); // Generate unique ID

    const notification: NotificationData = {
      id: notificationId,
      userId,
      auctionId,
      productId,
      message,
      time,
      type,
      read: false,
    };

    // Convert userId to string for room identification
    const userIdString = userId.toString();
    const userRoom = `user:${userIdString}`;

    // Emit to user-specific room with the notification ID
    io.to(userRoom).emit("notification", notification);

    console.log(`Notification sent to room: ${userRoom}, message: ${message}`);

    // Store in Redis for persistence
    const key = `notifications:${userIdString}`;
    await redisClient.lpush(key, JSON.stringify(notification));
    await redisClient.expire(key, 15 * 24 * 60 * 60); // 15 days

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};

export default createNotification;
