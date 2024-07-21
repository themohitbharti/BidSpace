import cron from 'node-cron';
import { Auction } from '../models/auction.models'; 
import { BidModel } from '../models/bid.models';
import { Product } from '../models/product.models'; 
import { redisClient } from '../config/redisClient';

cron.schedule('0 * * * *', async () => { 
  try {
    const currentTime = new Date();
    const endedAuctions = await Auction.find({ endTime: { $lte: currentTime } });

    for (const auction of endedAuctions) {
      const streamKey = `auctionStream:${auction._id}`;

      const lastBid = await redisClient.xrevrange(streamKey, '+', '-', 'COUNT', 1);
      const highestBid = lastBid.length > 0 ? JSON.parse(lastBid[0][1][1]) : null;

      const product = await Product.findOne({ auctionId: auction._id });

      if (product) {
        if (highestBid) {
          product.status = 'sold';
          product.finalSoldPrice = highestBid.bidAmount;
          product.finalBid = {
            userId: highestBid.userId,
            bidAmount: highestBid.bidAmount
          };
        } else {
          product.status = 'unsold';
        }
        await product.save();
      }

      await BidModel.deleteMany({ auctionId: auction._id });

      await redisClient.del(streamKey);
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});
