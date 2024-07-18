import { Request, Response } from "express";
import mongoose from "mongoose";
import { Product, IProduct } from "../models/product.models";
import { asyncHandler } from "../utils/asyncHandler";
import { User, UserDocument } from "../models/user.models";
import {Auction , IAuction} from "../models/auction.models";
import {BidModel , BidDocument} from "../models/bid.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { uploadOnCloudinary } from "../utils/uploadFiles";
import { redisClient } from "../config/redisClient";

const listProducts = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, description, basePrice, category, endTime } = req.body;
  const userId = req.user._id;

  const user: UserDocument | null = await User.findById(userId);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

let coverImages;
if (Array.isArray(req.files)) {
    coverImages = req.files as Express.Multer.File[];
} else {
    coverImages = (req.files as { [fieldname: string]: Express.Multer.File[]; })['coverImages'];
}

if (!coverImages) {
    res.status(400).json({ success: false, message: 'No cover images uploaded' });
    return;
}

  const cloudinaryUploadPromises = coverImages.map(async (file: Express.Multer.File) => {
    const cloudinaryResponse = await uploadOnCloudinary(file.path);
    return cloudinaryResponse?.secure_url;
  });

  const cloudinaryUrls = await Promise.all(cloudinaryUploadPromises);

  const newProduct = new Product({
    title,
    description,
    basePrice,
    category,
    coverImages: cloudinaryUrls,
    listedBy: user._id,
  });

  const savedProduct: IProduct = await newProduct.save();

  if (savedProduct && savedProduct._id) {
    const productId: string = savedProduct._id.toString();
    user.productsListed.push(productId);
    await user.save();
  }

  const currentTime = new Date();

  const auctionDurationHours = parseInt(endTime);
  if (isNaN(auctionDurationHours) || auctionDurationHours < 1 || auctionDurationHours > 168) {
    return res.status(400).json({
      success: false,
      message: "Auction end time must be between 1 and 168 hours",
    });
  }

  const auctionEndTime = new Date(currentTime.getTime() + auctionDurationHours * 60 * 60 * 1000);

  const newAuction = new Auction({
    productId: savedProduct._id,
    startPrice: basePrice,
    currentPrice: basePrice,
    endTime: auctionEndTime,
    bidders: [],
  });

  const savedAuction = await newAuction.save();

  const cacheKey = `product:${savedProduct._id}`;
  const cacheValue = JSON.stringify({
    title: savedProduct.title,
    description: savedProduct.description,
    basePrice: savedProduct.basePrice,
    category: savedProduct.category,
    coverImages: savedProduct.coverImages,
    listedBy: savedProduct.listedBy,
    createdAt: savedProduct.createdAt,
    updatedAt: savedProduct.updatedAt,
  });

  await redisClient.setex(cacheKey, 300, cacheValue);

  return res.status(201).json({
    success: true,
    message: "Product listed and auction started successfully",
    data: {
      product: newProduct,
      auction: savedAuction,
    },
  });

  
});


const showWaitingPurchases = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user._id;

    const cachedData = await redisClient.get(`waitingPurchases:${userId}`);
  if (cachedData) {
    return res.status(200).json({
      success: true,
      message: 'Successfully fetched waiting purchases from cache',
      data: JSON.parse(cachedData),
    });
  }

    const userBids: BidDocument[] = await BidModel.find({ userId });

    const auctionIds = userBids.map((bid) => bid.auctionId);

    const activeAuctions = await Auction.find({
      _id: { $in: auctionIds },
      endTime: { $gt: new Date() },
    });
   
    const waitingPurchases = activeAuctions.map((auction) => ({
      productId: auction.productId,
      currentPrice: auction.currentPrice,
      endTime: auction.endTime,
      bidAmount: userBids.find((bid) => bid.auctionId === auction._id)?.bidAmount,
      auctionId: auction._id,
    }));

    await redisClient.setex(`waitingPurchases:${userId}`, 120, JSON.stringify(waitingPurchases)); // Cache for 2 minutes


    return res.status(200).json({
      success: true,
      message: 'Successfully fetched waiting purchases',
      data: waitingPurchases,
    });
});

export { listProducts, showWaitingPurchases };
