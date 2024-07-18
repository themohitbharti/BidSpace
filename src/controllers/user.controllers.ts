import { Request, Response } from "express";
import { check, body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { User, UserDocument } from "../models/user.models";
import { CustomRequest } from "../middlewares/verifyToken.middleware";
import { OTP, OTPDocument } from "../models/otp.models";
import { sendEmail } from "../utils/sendEmails";

const generateOTP = (): string => {
  const otp = crypto.randomInt(1000, 9999).toString();
  return otp;
};

const registerUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  const {  email, fullName, password } = req.body as {
    email: string;
    fullName: string;
    password: string;
  };

  if (!email || !fullName || !password) {
    res.status(400).json({
      success: false,
      message: "Please provide all fields",
    });
    return;
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  let existedUser: UserDocument | null;
  try {
    existedUser = await User.findOne({
      email
    });
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
    return;
  }

  if (existedUser) {
    res.status(400).json({
      success: false,
      message: "User credentials already registered",
    });
    return;
  }

  let otpDocument: OTPDocument | null;
  try {
    otpDocument = await OTP.findOne({ email });
  } catch (error) {
    console.error("Error finding OTP document:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (otpDocument) {
    otpDocument.otp = otp;
    otpDocument.expiresAt = otpExpiresAt;
  } else {
    otpDocument = new OTP({
      email,
      otp,
      expiresAt: otpExpiresAt,
    });
  }

  await otpDocument.save();
  await sendEmail(
    email,
    "Your OTP Code",
    `Your OTP code is ${otp}. It is valid for 10 minutes.`
  );

  res.status(201).json({
    success: true,
    message: "OTP sent to email. Please verify to complete registration.",
  });
});

const verifyOTP = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { email, otp, fullName, password } = req.body as {
    email: string;
    otp: string;
    fullName: string;
    password: string;
  };

  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: "OTP has expired",
    });
  }

  const newUser = await User.create({
    email,
    fullName,
    password,
  });

  const data = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  await OTP.deleteOne({ email, otp });

  await sendEmail(
    email,
    "Welcome to Our Platform",
    "Thank you for registering!"
  );

  res.status(201).json({
    success: true,
    message: "User registered",
    data,
  });
});

const loginUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  await check("email", "Email is not valid").isEmail().run(req);
  await check("password", "Password cannot be blank")
    .isLength({ min: 6 })
    .run(req);
  await body("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  // const schema= yup.object().shape({
  //   email:yup.string().required(),
  //   password:yup.string().required(),
  // })

  // const result = await schema.validate(req.body)

  // const {email,password}=result

  const { email, password } = req.body;

  if (!email ) {
    return res.status(402).json({
      success: false,
      message: "enter email",
    });
  }

  if (!password) {
    return res.status(402).json({
      success: false,
      message: "enter password",
    });
  }


  const existedUser = await User.findOne({email});

  if (!existedUser) {
    return res.status(400).json({
      success: false,
      message: "no such user found",
    });
  }

  const passwordCheck = await existedUser.isPasswordCorrect(password);

  if (!passwordCheck) {
    return res.status(402).json({
      success: false,
      message: "wrong password",
    });
  }

  const accessToken = await existedUser.generateAccessToken();
  const refreshToken = await existedUser.generateRefreshToken();

  existedUser.refreshToken = refreshToken;
  await existedUser.save({ validateBeforeSave: false });

  const loggedInUser = (await User.findOne({
    email
  }).select("-password -refreshToken")) as UserDocument | null;

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      success: true,
      message: "user successfully login",
      data: [
        {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      ],
      user: loggedInUser,
    });
});

const logoutUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      success: true,
      message: "user logged out",
    });
});

const refreshAccessToken = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const oldResfreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!oldResfreshToken) {
      return res.status(400).json({
        success: false,
        message: "invalid access",
      });
    }

    try {
      const decodedToken = jwt.verify(
        oldResfreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as { _id: string };

      const user = await User.findById(decodedToken?._id);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "invalid access",
        });
      }

      if (user.refreshToken !== oldResfreshToken) {
        return res.status(400).json({
          success: false,
          message: "invalid token",
        });
      }

      const options = {
        httpOnly: true,
        secure: true,
      };

      const accessToken = await user.generateAccessToken();
      const newRefreshToken = await user.generateRefreshToken();

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("newResfreshToken", newRefreshToken, options)
        .json({
          success: true,
          message: "new Tokens generated",
          data: {
            accessToken: accessToken,
            refreshToken: newRefreshToken,
          },
        });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "invalid token",
      });
    }
  }
);

const changePassword = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body as {
      oldPassword: string;
      newPassword: string;
    };

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!oldPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password needed",
      });
    }

    const passwordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!passwordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Password changed",
    });
  }
);

const forgotPassword = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expirationTime = new Date(Date.now() + 3600000); // 1 hour from now

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expirationTime;
    await user.save();

    const subject =
      "Verification link for resetting password in Typescript Auth";
    const message = `Click this verification link: http://localhost:3000/api/v1/user/reset-password/?token=${token}`;

    try {
      await sendEmail(email, subject, message);
      return res.json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Email not sent",
        error: error,
      });
    }
  }
);

const resetPassword = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and password required",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No user found",
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been changed",
    });
  }
);

export {
  registerUser,
  verifyOTP,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
