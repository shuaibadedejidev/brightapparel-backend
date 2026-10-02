import rateLimit from 'express-rate-limit';

// 1. Global Limiter (Apply to all routes)
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// 2. Strict Limiter for Auth & Sensitive Endpoints
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' }
});