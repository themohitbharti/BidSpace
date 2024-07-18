import { Request, Response } from "express";
import { check, body, validationResult } from "express-validator";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import {Auction , IAuction} from "../models/auction.models";
import {BidModel } from "../models/bid.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { redisClient } from "../config/redisClient";

const bidInAuction = asyncHandler(async (req: CustomRequest, res: Response) => {

    await check("bidAmount").toFloat().run(req);

  const { auctionId, bidAmount } = req.body as { auctionId: string; bidAmount: number; };;
  const user = req.user
  const userId = req.user._id as string;

  if (!auctionId || !bidAmount) {
    return res.status(400).json({
      success: false,
      message: "Auction ID and bid amount are required",
    });
  }

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    return res.status(404).json({
      success: false,
      message: "Auction not found",
    });
  }

  const currentTime = new Date();
  if (auction.endTime <= currentTime) {
    return res.status(400).json({
      success: false,
      message: "Auction has ended",
    });
  }

  if (bidAmount <= auction.currentPrice) {
    return res.status(400).json({
      success: false,
      message: "Bid amount must be higher than the current price",
    });
  }


  const availableMoney = user.totalCoins - user.reservedCoins;

  if (bidAmount > availableMoney) {
    return res.status(400).json({
      success: false,
      message: "Insufficient funds",
    });
  }

  auction.currentPrice = bidAmount;
  auction.bidders.push({ userId: new mongoose.Types.ObjectId(userId) , bidAmount });
  await auction.save();

  user.reservedCoins += bidAmount;
  await user.save();

  const newBid = new BidModel({
    auctionId,
    userId,
    bidAmount,
  });

  const savedBid = await newBid.save();

  const cacheKey = `auction:${auctionId}`;
  const cacheValue = JSON.stringify({
    currentPrice: auction.currentPrice,
    bidders: auction.bidders,
    updatedAt: new Date(),
  });

  try {
    await redisClient.set(cacheKey, cacheValue, 'EX', 60);
    console.log("Cache set successfully");
  } catch (error) {
    console.error("Error setting cache:", error);
  }

  const streamKey = `auctionStream:${auctionId}`;
  const eventData = JSON.stringify({
    userId,
    bidAmount,
    timestamp: new Date().toISOString(),
  });

  try {
    await redisClient.xadd(streamKey, 'MAXLEN', '~', 15, '*', 'bid', eventData);
    console.log("Bid added to Redis stream successfully");
  } catch (error) {
    console.error("Error adding bid to Redis stream:", error);
  }

  return res.status(201).json({
    success: true,
    message: "Bid placed successfully",
    data: {
      auction,
      bid: savedBid,
    },
  });
});

export { bidInAuction };
