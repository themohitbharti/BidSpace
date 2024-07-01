import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { User, UserDocument } from "../models/user.models";

export interface CustomRequest extends Request {
  user: UserDocument;
}

const verifyToken = asyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token required",
        });
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET ?? ""
      ) as { _id: string };

      const user = await User.findById(decodedToken?._id);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid token",
        });
      }

      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        success: false,
        message: "Error occurred in token verification",
      });
    }
  }
);

export { verifyToken };
