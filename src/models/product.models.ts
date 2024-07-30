import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  title: string;
  basePrice: number;
  description?: string;
  category: string;
  coverImages?: string[];
  listedBy: mongoose.Schema.Types.ObjectId;
  status: 'live' | 'sold' | 'unsold';
  finalSoldPrice?: number;
  auctionId?: mongoose.Schema.Types.ObjectId;
  finalBid?: {
    userId: mongoose.Schema.Types.ObjectId;
    bidAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  coverImages: {
    type: [String],
    trim: true,
  },
  listedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["live","sold", "unsold"],
    default: "live",
  },
  finalSoldPrice: {
    type: Number,
    min: 0,
  },
  auctionId: {
    type: Schema.Types.ObjectId,
    ref: "Auction",
  },
  finalBid: {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    bidAmount: {
      type: Number,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.pre<IProduct>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Product = mongoose.model<IProduct>("Product", productSchema);
