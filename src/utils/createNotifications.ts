import moment from 'moment';
import { io } from '../index';
import { redisClient } from '../config/redisClient';
import { ObjectId } from 'mongoose';

const createNotification = async ( userId: ObjectId, message: string,auctionId:ObjectId) => {
  try {
    const time = moment().toDate();
    
    const notification = { userId,auctionId, message, time };

    io.to(`user:${userId}`).emit('notifications', notification);

    const today = moment().format('YYYY-MM-DD');

    const key = `notifications:${userId}`;

    await redisClient.lpush(key, JSON.stringify(notification));
    await redisClient.expire(key, 15 * 24 * 60 * 60);

  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

export default createNotification;
