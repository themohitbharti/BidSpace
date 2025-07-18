import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { User, UserDocument } from "../models/user.models";
import { Product } from "../models/product.models";
import { BidModel } from "../models/bid.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";

export const addToWishlist = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID required" });
    }

    // Check if already bidding
    const alreadyBidding = await BidModel.findOne({
      userId,
      auctionId: (await Product.findById(productId))?.auctionId,
    });
    if (alreadyBidding) {
      return res
        .status(400)
        .json({ success: false, message: "Already bidding in this product" });
    }

    // Check if already in wishlist
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.wishlist.includes(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Product added to wishlist" });
  }
);

export const removeFromWishlist = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID required" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Product removed from wishlist" });
  }
);

export const getWishlist = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("wishlist");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user.wishlist });
  }
);
