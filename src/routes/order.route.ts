// routes/order.routes.ts
import express from 'express'
import { authMiddleware, adminMiddlware } from '../middlewares/auth.middleware.js'
import { createOrder, getUserOrders, updateOrderStatus, getAllOrdersAdmin, verifyOrderPayment, handlePaymentWebhook } from '../controllers/order.controller.js'
import { globalLimiter, strictLimiter } from '../lib/rateLimit.js'

const router = express.Router()

// User Routes
router.post('/', strictLimiter, authMiddleware, createOrder)
router.get('/', globalLimiter, authMiddleware, getUserOrders)

// User route to verify payment status after redirect
router.get('/:id/verify', authMiddleware, verifyOrderPayment);

// Payment webhook 
router.post('/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

// Admin Routes
router.get('/all', globalLimiter, authMiddleware, adminMiddlware, getAllOrdersAdmin)
router.patch('/:id/status', globalLimiter, authMiddleware, adminMiddlware, updateOrderStatus) 


export default router