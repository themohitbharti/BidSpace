import express from 'express';
import { listProducts , showWaitingPurchases} from '../controllers/product.controllers'; 
import { upload } from '../middlewares/multer.middlewares';
import { verifyToken } from '../middlewares/verifyToken.middleware';

const router = express.Router();

router.post('/upload', 
    upload.fields([
        {
            name: "coverImages",
            maxCount: 5,
        }
    ]),
    verifyToken,
    listProducts);

router.get('/waiting' ,verifyToken, showWaitingPurchases)    


export default router;
