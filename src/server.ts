import express from 'express';
import { Request, Response, NextFunction } from 'express'

import cookieParser from 'cookie-parser'
import cors from 'cors';
import ENV_VARIABLES from './lib/ENV.js';

import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.route.js'
import uploadRoute from './routes/upload.route.js'
import cartRoutes from './routes/cart.route.js'
import orderRoutes from './routes/order.route.js'
import adminRoutes from './routes/admin.route.js'

const app = express();

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

const clientUrl: string = ENV_VARIABLES.CLIENT_URL.replace(/\/$/, '') // Removes trailing slash if present,

app.use(cors({
    origin: clientUrl,
    credentials: true 
}))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/upload', uploadRoute)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

const PORT = ENV_VARIABLES.PORT
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});  