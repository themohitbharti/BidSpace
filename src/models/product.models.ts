import mongoose, { Document, Schema } from 'mongoose';

interface IProduct extends Document {
  name: string;
  basePrice: number;
  description?: string;
  category: string;
  coverImage?: string;
  listedBy: mongoose.Types.ObjectId;
  status: 'sold' | 'unsold';
  finalSoldPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
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
  coverImage: {
    type: String,
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

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
