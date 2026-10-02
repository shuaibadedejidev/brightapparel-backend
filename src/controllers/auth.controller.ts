import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requestOTP, verifyOTP } from '../services/otp.service.js';

import ENV_VARIABLES from '../lib/ENV.js'; 

const setToken = (id: string, res: Response) => {
    const token = jwt.sign({ id }, ENV_VARIABLES.JWT_SECRET as string, { expiresIn: '5d'})
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: ENV_VARIABLES.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 24 * 60 * 60 * 1000,
    })
}

interface AuthRequest extends Request {
    user?: {
        id: string
        email?: string
        role?: string
        [key: string]: any // Accepts dynamic/varying fields
    }
}

export const getMe = (req: AuthRequest, res: Response) => {
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log('Error in get me controller')
        res.status(500).json({ error: 'Failed to fetch' })
    }
}

interface signUpBody {
    fullName: string,
    email: string,
    password: string
}

export const signUp = async (req: Request<{}, {}, signUpBody>, res: Response) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ error: 'All fields required' })

    try {
            const existingUser = await db.user.findUnique({
                where: { email }
            })

            if (existingUser) return res.status(400).json({ error: 'Email already registered' })
            
            const hashedPassword = await bcrypt.hash(password, 10)

            const user = await db.user.create({
                data: {
                    fullName,
                    email,
                    password: hashedPassword
                }
            })

            await requestOTP(email)

            res.status(201).json({ message: 'Signup successful' })
    } catch (error: any) {
        console.log('Error in signup controller', error.message)
        res.status(500).json({ error: 'Internal server error' })
    }
}

interface signInBody {
    email: string,
    password: string
}

export const logIn = async (req: Request<{}, {}, signUpBody>, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) return res.status
    try {
        const user = await db.user.findUnique({
            where: { email }
        })

        if (!user) return res.status(400).json({ error: 'Invalid credentials' })
        
        const comparePassword = await bcrypt.compare(password, user.password)
        if (!comparePassword) return res.status(400).json({ error: 'Invalid credentials' })
        
        setToken(user.id, res)
        res.status(200).json({ message: 'Login successfull', user })
    } catch (error) {
        console.log('Error in login controller')
        res.status(500).json({ error: 'Error logining' })
    }
}

export const logOut = (req: Request, res: Response) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log('Error in logout controller')
        res.status(500).json({ error: 'Failed to logout'})
    }
}

export const sendOtp = async (req: Request, res: Response) => {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'User email not provided' })
    try {
        const user = await db.user.findUnique({
            where: { email: email }
        })

        if (!user) return res.status(404).json({ error: 'No validation otp requested for this email' })
        if (user?.isVerified === true) return res.status(400).json({ error: 'Email already verified' })

        await requestOTP(email)
    } catch (error) {
        console.log('Error in send otp controller')
        res.status(500).json({ error: 'Internal server error' })
    }
}

interface otpBody {
    otpCode: string,
    email: string
}

export const verifyOtp = async (req: Request<{}, {}, otpBody>, res: Response) => {
    const { email, otpCode } = req.body 
    try {
        const user = await db.user.findUnique({
            where: { email }
        })

        if (!user) return res.status(404).json({ error: 'No validation otp requested for this email' })
        const isVerified = await verifyOTP(email, otpCode)

        if (isVerified) {
            const updatedUser = await db.user.update({
                where: { email },
                data: {
                    isVerified: true,
                },
            });

            updatedUser.password = ''

            await setToken(updatedUser.id, res)

            return res.status(200).json({
                message: 'Email verified successfully',
                user: updatedUser,
            });
        }
    } catch (error: any) {
        console.log('Error in verify opt controller', error.message)
        res.status(500).json({ error: error.message || 'Verification failed' })
    }
}