import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {User } from '../models/user.models';
import { CustomRequest } from '../middlewares/verifyToken.middleware';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { amount } = req.body;
  const userId = req.user._id;

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: 'Amount is required fields'
    });
  }

  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(201).json({
      success: true,
      orderId: order.id,
      amount_in_paise: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
    });
  }
});

const verifyPayment = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { paymentId, orderId, signature, amount } = req.body;
  
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
  
    if (generatedSignature === signature) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
  
      user.coins += amount;
  
      await user.save();
  
      return res.status(200).json({
        success: true,
        message: 'Payment verified and coins added',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  });

  const checkPurse = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user._id;
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
  
      const coins = user.coins;
      const reservedCoins = user.reservedCoins;
      const overallCoins = coins + reservedCoins;
  
      res.status(200).json({
        success: true,
        coins,
        reservedCoins,
        overallCoins,
      });
    } catch (error) {
      console.error('Error checking purse:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  });

export { createOrder, verifyPayment ,checkPurse};
