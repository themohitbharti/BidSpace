import { Router } from 'express';
import { createOrder , verifyPayment } from '../controllers/payment.controllers';
import { verifyToken } from '../middlewares/verifyToken.middleware';

const router = Router();

router.post('/order', verifyToken, createOrder);

router.post('/verify-payment', verifyToken, verifyPayment);


export default router;
