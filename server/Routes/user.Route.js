import express from 'express';
import { getUserData } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { storeRecentSearchedCities } from '../controllers/user.controller.js';



const userRouter = express.Router();

userRouter.get('/', protect, getUserData);
userRouter.post('/store-recent-search', protect, storeRecentSearchedCities);

export default userRouter;