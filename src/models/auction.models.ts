import mongoose, { Document, Schema } from 'mongoose';

export interface IAuction extends Document {
  productId: mongoose.Types.ObjectId;
  startPrice: number;
  currentPrice: number;
  endTime: Date;
  bidders: {
    userId: mongoose.Types.ObjectId;
    bidAmount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product', 
    required: true
  },
  startPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  endTime: {
    type: Date,
    required: true
  },
  bidders: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User' 
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

auctionSchema.pre<IAuction>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Auction = mongoose.model<IAuction>('Auction', auctionSchema);

