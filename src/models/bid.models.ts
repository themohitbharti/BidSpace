import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface Bid {
  auctionId: ObjectId; 
  userId: ObjectId;
  amount: number;
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
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BidModel = mongoose.model<BidDocument>("Bid", bidSchema);

export default BidModel;
