import cron from 'node-cron';
import { Auction } from '../models/auction.models'; 
import { BidModel } from '../models/bid.models';
import { Product } from '../models/product.models'; 
import { User } from '../models/user.models';
import { redisClient } from '../config/redisClient';
import createNotification from '../utils/createNotifications';
import mongoose from 'mongoose';

cron.schedule('*/20 * * * *', async () => { 
  try {
    const currentTime = new Date();
    const endedAuctions = await Auction.find({ endTime: { $lte: currentTime }});

    for (const auction of endedAuctions) {

      const auctionId = auction._id as mongoose.Schema.Types.ObjectId

      const product = await Product.findOne({ auctionId: auctionId });

      if (product && product.status === 'live') {
        const streamKey = `auctionStream:${auction._id}`;

        const bids = await BidModel.find({ auctionId: auction._id }).sort({ createdAt: -1 });
        const highestBid = bids.length > 0 ? bids[0] : null;

        if (highestBid) {
          product.status = 'sold';
          product.finalSoldPrice = highestBid.bidAmount;
          product.finalBid = {
            userId: highestBid.userId,
            bidAmount: highestBid.bidAmount
          };

          await User.findByIdAndUpdate(highestBid.userId, {
            $push: { productsPurchased: product._id },
            $inc: { coins: -highestBid.bidAmount }
          });

          await createNotification(highestBid.userId, `Congratulations! You won the auction for product ${product.title}.`, auctionId);

        } else {
          product.status = 'unsold';
        }
        await product.save();

        for (const bidder of auction.bidders) {
            const user = await User.findById(bidder.userId);
            if (user) {
              user.coins += bidder.bidAmount;
              user.reservedCoins -= bidder.bidAmount;
              await user.save();
            }
          }

        const winnerUserId = highestBid?.userId.toString() || '';
        for (const bidder of auction.bidders) {
          if (bidder.userId.toString() !== winnerUserId) {
            const user = await User.findById(bidder.userId);
            if (user) {
              await createNotification(bidder.userId, `Refund of ${bidder.bidAmount} coins has been processed for auction ${auction._id}.`, auctionId);
            }
          }
        }

          await BidModel.deleteMany({ auctionId: auction._id });
          await redisClient.del(streamKey);
      }
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});
