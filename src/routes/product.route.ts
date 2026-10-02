import express from "express";

import { createProduct, getAllProducts, getFeaturedProducts, updateProduct, deleteProduct, getProductById } from '../controllers/product.controller.js'
import { authMiddleware, adminMiddlware } from "../middlewares/auth.middleware.js";
import { globalLimiter } from "../lib/rateLimit.js";

const router = express.Router()

router.get('/', globalLimiter, getAllProducts)
router.get('/featured', globalLimiter, getFeaturedProducts)
router.get('/:id', globalLimiter, getProductById)
router.post('/create', globalLimiter, authMiddleware, adminMiddlware, createProduct)
router.put('/:id', globalLimiter, authMiddleware, adminMiddlware, updateProduct)
router.delete('/:id', globalLimiter, authMiddleware, adminMiddlware, deleteProduct)

export default router