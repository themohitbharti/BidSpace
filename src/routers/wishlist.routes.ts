import express from "express";
import { verifyToken } from "../middlewares/verifyToken.middleware";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../controllers/wishlist.controllers";

const router = express.Router();

router.post("/add", verifyToken, addToWishlist);
router.post("/remove", verifyToken, removeFromWishlist);
router.get("/", verifyToken, getWishlist);

export default router;
