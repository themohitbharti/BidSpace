import express from "express";
import {
  listProducts,
  showWaitingPurchases,
  showByCategory,
  showProductDetails,
  showPurchasedProducts,
  searchProducts,
  getRecentProducts,
  getTrendingProducts,
  showListedProducts, // Add this import
} from "../controllers/product.controllers";
import { upload } from "../middlewares/multer.middlewares";
import { verifyToken } from "../middlewares/verifyToken.middleware";

const router = express.Router();

router.post(
  "/upload",
  upload.fields([
    {
      name: "coverImages",
      maxCount: 5,
    },
  ]),
  verifyToken,
  listProducts
);

router.get("/waiting", verifyToken, showWaitingPurchases);

router.get("/list/:category/:status", showByCategory);

router.get("/details/:id", showProductDetails);

router.get("/purchased", verifyToken, showPurchasedProducts);

router.get("/listed", verifyToken, showListedProducts); // Add this new route

router.get("/search", searchProducts);

router.get("/recent", getRecentProducts);

router.get("/trending", getTrendingProducts);

export default router;
