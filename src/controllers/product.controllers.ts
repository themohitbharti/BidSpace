import { Request, Response } from "express";
import { Product, IProduct } from "../models/product.models";
import { asyncHandler } from "../utils/asyncHandler";
import { User, UserDocument } from "../models/user.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { uploadOnCloudinary } from "../utils/uploadFiles";

const listProducts = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, description, basePrice, category } = req.body;
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

// Check if coverImages is valid
if (!coverImages) {
    res.status(400).json({ success: false, message: 'No cover images uploaded' });
    return;
}

//   const images = coverImages.map((file: Express.Multer.File) => file.path);

  const cloudinaryUploadPromises = coverImages.map(async (file: Express.Multer.File) => {
    const cloudinaryResponse = await uploadOnCloudinary(file.path);
    return cloudinaryResponse?.secure_url; // Get secure URL from Cloudinary response
  });

  // Wait for all uploads to complete
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

  return res.status(201).json({
    success: true,
    message: "producted listed successfully",
    data: newProduct,
  });
});

export { listProducts };
