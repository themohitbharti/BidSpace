import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface Bid {
  auctionId: mongoose.Schema.Types.ObjectId; 
  userId: mongoose.Schema.Types.ObjectId;
  bidAmount: number;
  createdAt?: Date;
}

export interface BidDocument extends Bid, Document {}

const bidSchema: Schema<BidDocument> = new Schema({
  auctionId: {
    type: Schema.Types.ObjectId,
    ref: "Auction",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bidAmount: {
    type: Number,
    required: true,
    min:0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const BidModel = mongoose.model<BidDocument>("Bid", bidSchema);


