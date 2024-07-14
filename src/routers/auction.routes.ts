import express from 'express';
import { bidInAuction } from '../controllers/auction.controllers';
import { verifyToken } from '../middlewares/verifyToken.middleware';

const router = express.Router();

router.post('/bid', verifyToken, bidInAuction);


export default router;
