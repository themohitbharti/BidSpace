import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  basePrice: number;
  description?: string;
  category: string;
  coverImages?: string[];
  listedBy: mongoose.Types.ObjectId;
  status: 'sold' | 'unsold';
  finalSoldPrice?: number;
  auctionId:mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true 
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true 
  },
  coverImages: {
    type: [String],
    trim: true
  },
  listedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['sold', 'unsold'],
    default: 'unsold'
  },
  finalSoldPrice: {
    type: Number,
    min: 0
  },
  auctionId: {
    type:Schema.Types.ObjectId,
    ref: 'Auction'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre<IProduct>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);

