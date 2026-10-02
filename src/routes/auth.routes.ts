import express from "express";
import { getMe, signUp, sendOtp, verifyOtp, logIn, logOut } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { globalLimiter, strictLimiter } from "../lib/rateLimit.js";

const router = express.Router()

router.get('/me', globalLimiter, authMiddleware, getMe)
router.post('/signup', strictLimiter, signUp)
router.post('/send-otp', strictLimiter, sendOtp)
router.post('/verify-otp', strictLimiter, verifyOtp)
router.post('/login', strictLimiter, logIn)
router.post('/logout', globalLimiter, logOut)



export default router