import { Request, Response } from "express";
import { Product, IProduct } from "../models/product.models";
import { asyncHandler } from "../utils/asyncHandler";
import { User, UserDocument } from "../models/user.models";
import Auction from "../models/auction.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { uploadOnCloudinary } from "../utils/uploadFiles";

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

  const savedProduct = await newProduct.save();

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

  return res.status(201).json({
    success: true,
    message: "Product listed and auction started successfully",
    data: {
      product: newProduct,
      auction: savedAuction,
    },
  });

  
});

export { listProducts };
