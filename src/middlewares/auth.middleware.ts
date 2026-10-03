import { Request, Response, NextFunction } from 'express'
import ENV_VARIABLES from '../lib/ENV.js';
import jwt from 'jsonwebtoken'
import { db } from '../db.js';

const SECRET = ENV_VARIABLES.JWT_SECRET

interface tokenPayload {
    id: string
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.authToken;
        if (!token) return res.status(401).json({ error: 'No token provided' })

        if (!SECRET) return console.log('JWT SECRET is required')

        const decoded = jwt.verify(token, SECRET) as tokenPayload
        if (!decoded) return res.status(400).json({ error: 'Invalid token' })

        //fetch user data
        const user = await db.user.findUnique({
            where: { id: decoded.id }
        })

        if (!user) return res.status(404).json({ error: 'User not found' })
        user.password = ''

        req.user = user
        next()
    } catch (error: any) {
        console.log('Error in Auth middleware', error.message)
        res.status(500).json({ error: 'Internal server error' })
    }
}

export const adminMiddlware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Only admin can perform this action' })
        next()
    } catch (error) {
        console.log('Error in admin middlware')
        res.status(500).json({ error: 'Internal server error' })
    }
} 