import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyOTP,
  changePassword,
  forgotPassword,
  resetPassword,
  getAllNotifications,
  getUser,
  editUserProfile,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/user.controllers";
import { verifyToken } from "../middlewares/verifyToken.middleware";
import { validateInput } from "../middlewares/isValidInput.middleware";

const router = express.Router();

router.post("/register", validateInput, registerUser);

router.post("/verify-otp", validateInput, verifyOTP);

router.post("/login", loginUser);

router.post("/logout", verifyToken, logoutUser);

router.post("/regenerate-tokens", refreshAccessToken);

router.post("/change-password", verifyToken, changePassword);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/notifications", verifyToken, getAllNotifications);

router.post("/notifications/read", verifyToken, markNotificationAsRead);
router.post("/notifications/read-all", verifyToken, markAllNotificationsAsRead);

router.get("/details", verifyToken, getUser);

router.put("/edit", verifyToken, editUserProfile);

export default router;
