import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config()

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err: any) => {
  console.error('Redis connection error:', err);
});

export { redisClient };
