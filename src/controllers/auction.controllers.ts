import { Request, Response } from "express";
import { check, body, validationResult } from "express-validator";
import mongoose from "mongoose";
import { Socket } from 'socket.io';
import {io} from "../index";
import { asyncHandler } from "../utils/asyncHandler";
import {Auction , IAuction} from "../models/auction.models";
import {BidModel } from "../models/bid.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { redisClient } from "../config/redisClient";
import { Product } from "../models/product.models";
import { User } from "../models/user.models";


export const joinAuctionRoom = async (socket: Socket, auctionId: string) => {
  
  try {
    const auction = await Auction.findById(auctionId);
  
    if (!auction) {
      socket.emit('error', 'Auction not found.');
      return;
    }
  
    const currentTime = new Date();
    if (auction.endTime <= currentTime) {
      socket.emit('error', 'Auction has already ended.');
      return;
    }
  
    console.log(`User ${socket.id} joined auction room: ${auctionId}`);
    
    socket.join(`auction:${auctionId}`);
  
    // Emit a message to the user confirming they have joined the room
    socket.emit('joinedAuctionRoom', `You have joined auction room: ${auctionId}`);
  
    // Optionally notify other users in the room (excluding the sender) about the new participant
    socket.to(`auction:${auctionId}`).emit('newParticipant', `User ${socket.id} has joined the auction.`);
  } catch (error) {
    console.error('Error joining auction room:', error);
    socket.emit('error', 'An error occurred while joining the auction room.');
  }
};

const bidInAuction = asyncHandler(async (req: CustomRequest, res: Response) => {

    await check("bidAmount").toFloat().run(req);

  const { auctionId, bidAmount } = req.body as { auctionId: string; bidAmount: number; };;
  const user = req.user
  const userId = req.user._id as mongoose.Types.ObjectId;

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

    await cleanupAuctionBids(new mongoose.Types.ObjectId(auctionId));

    return res.status(400).json({
      success: false,
      message: "Auction has ended",
    });
  }

  if (bidAmount <= auction.startPrice && auction.currentPrice === auction.startPrice) {
    auction.currentPrice = bidAmount;
  } else if (bidAmount <= auction.currentPrice) {
    return res.status(400).json({
      success: false,
      message: "Bid amount must be higher than the current price",
    });
  }


  const previousBids = await BidModel.find({ auctionId, userId });
  const highestPreviousBid = previousBids.length > 0 ? previousBids[previousBids.length - 1].bidAmount : 0;
  const extraAmount = Math.max(0, bidAmount - highestPreviousBid);

  const availableMoney = user.coins;

  if (extraAmount > availableMoney) {
    return res.status(400).json({
      success: false,
      message: "Insufficient funds",
    });
  }

  auction.bidders = auction.bidders.filter(bidder => bidder.userId.toString() !== userId.toString());
  auction.bidders.push({ userId: new mongoose.Types.ObjectId(userId), bidAmount });
  await auction.save();

  user.reservedCoins += extraAmount;
  user.coins -= extraAmount;
  await user.save();

  const newBid = new BidModel({
    auctionId,
    userId,
    bidAmount,
  });

  const savedBid = await newBid.save();

  const cacheKey = `auction:${auction.productId}`;
  const cacheValue = JSON.stringify({
    currentPrice: auction.currentPrice,
    bidders: auction.bidders,
    updatedAt: new Date(),
  });

  try {
    await redisClient.set(cacheKey, cacheValue, 'EX', 60);
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

  io.to(`auction:${auctionId}`).emit('newBid', {
    userId,
    bidAmount,
    auctionId,
    currentPrice: auction.currentPrice,
    bidders: auction.bidders,
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    message: "Bid placed successfully",
    data: {
      auction,
      bid: savedBid,
    },
  });
});

async function cleanupAuctionBids(auctionId: mongoose.Types.ObjectId ) {
  const bids = await BidModel.find({ auctionId });

  if (bids.length > 0) {
    const lastBid = bids[bids.length - 1];
    await BidModel.deleteMany({ auctionId });

    const product = await Product.findOne({ auctionId });
    if (product) {
      product.finalBid = {
        userId: lastBid.userId,
        bidAmount: lastBid.bidAmount,
      };
      product.finalSoldPrice = lastBid.bidAmount; 
      product.status = 'sold';
      await product.save();

      await User.findByIdAndUpdate(lastBid.userId, {
        $push: { productsPurchased: product._id },
        $inc: { coins: -lastBid.bidAmount }
      });
    }

    const auction = await Auction.findOne({_id: auctionId})
    if(auction){
      for (const bidder of auction.bidders) {
      const user = await User.findById(bidder.userId);
      if (user) {
        user.coins += bidder.bidAmount;
        user.reservedCoins -= bidder.bidAmount;
        await user.save();
      }
    }
    }
    
  }
  else{
    const product = await Product.findOne({ auctionId });
    if (product) {
      product.status = 'unsold'; 
      await product.save();
    }
  }

  const streamKey = `auctionStream:${auctionId}`;
  try {
    await redisClient.del(streamKey);
    console.log(`Redis stream ${streamKey} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting Redis stream ${streamKey}:`, error);
  }
}

export { bidInAuction };
