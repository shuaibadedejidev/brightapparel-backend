import express from 'express'
import { adminMiddlware, authMiddleware } from '../middlewares/auth.middleware.js'
import { getAdminDashboard } from '../controllers/admin.controller.js'
import { globalLimiter } from '../lib/rateLimit.js'

const router = express.Router()

router.get('/dashboard', globalLimiter, authMiddleware, adminMiddlware, getAdminDashboard) 

export default router