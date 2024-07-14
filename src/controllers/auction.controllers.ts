import { Request, Response } from "express";
import { check, body, validationResult } from "express-validator";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import {Auction , IAuction} from "../models/auction.models";
import {BidModel } from "../models/bid.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { ObjectId } from 'mongoose';

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


  const availableMoney = user.totalMoney - user.reservedMoney;

  if (bidAmount > availableMoney) {
    return res.status(400).json({
      success: false,
      message: "Insufficient funds",
    });
  }

  auction.currentPrice = bidAmount;
  auction.bidders.push({ userId: new mongoose.Types.ObjectId(userId) , bidAmount });
  await auction.save();

  user.totalMoney -= bidAmount;
  user.reservedMoney += bidAmount;
  await user.save();

  const newBid = new BidModel({
    auctionId,
    userId,
    bidAmount,
  });

  const savedBid = await newBid.save();

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
