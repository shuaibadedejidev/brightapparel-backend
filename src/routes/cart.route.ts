import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getCart, addToCart, updateQuantity, removeFromCart  } from "../controllers/cart.controller.js";
import { globalLimiter } from "../lib/rateLimit.js";

const router = express.Router()

router.get('/', globalLimiter, authMiddleware, getCart)
router.post('/add', globalLimiter, authMiddleware, addToCart)
router.patch('/quantity', globalLimiter, authMiddleware, updateQuantity)
router.delete('/:id', globalLimiter, authMiddleware, removeFromCart)
 
export default router 