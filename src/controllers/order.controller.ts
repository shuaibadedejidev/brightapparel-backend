import { Request, Response } from "express"
import { db } from "../db.js"
import axios from 'axios'
import ENV_VARIABLES from "../lib/ENV.js"
import crypto from 'crypto'

export const createOrder = async (req: Request, res: Response) => {
    const userId = req.user!.id
    const { name, phone, address, additionalNotes, deliveryOption } = req.body

    if (!name || !phone || !address)
        return res.status(400).json({ error: 'All fields required' })

    if (deliveryOption !== 'delivery' && deliveryOption !== 'pickup') return res.status(400).json({ error: "delivery option must be either 'delivery' or 'pickup'" })

    try {
        const cartItems = await db.cart.findMany({
            where: { userId },
            include: {
                product: true
            }
        })

        if (cartItems.length === 0) return res.status(400).json({ error: 'Cart length cannot be 0' })

        const subtotal = cartItems.reduce((acc: number, item: { product: { price: number }, quantity: number }) => acc + item.product.price * item.quantity, 0);
        const deliveryFee = deliveryOption === 'delivery' ? 799 : 0;
        const tax = Math.floor(subtotal * 0.05); // 5% estimated tax
        const totalPayable = subtotal + deliveryFee + tax;

        const order = await db.order.create({
            data: {
                userId,
                name,
                phone,
                address,
                additionalNotes,
                deliveryOption,

                tax,
                deliveryFee,
                subtotal,
                total: totalPayable,

                status: 'PENDING',

                items: {
                    create: cartItems.map((item) => ({
                        price: item.product.price,
                        image: item.image,
                        color: item.color,
                        size: item.size,
                        quantity: item.quantity,
                        productId: item.productId
                    }))
                }
            },
            include: {
                items: true
            }
        })

        const paystackResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: req.user!.email,
                currency: 'NGN',
                amount: totalPayable,
                callback_url: `${ENV_VARIABLES.CLIENT_URL}/orders/${order.id}/verify`,
                metadata: {
                    orderId: order.id,
                    userId: req.user!.id,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${ENV_VARIABLES.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.status(201).json({ orderId: order.id, paymentUrl: paystackResponse.data.data.authorization_url })
    } catch (error: any) {
        console.log('error in handler controller ', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}

export const getUserOrders = async (req: Request, res: Response) => {
    const userId = req.user!.id

    try {
        const orders = await db.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }, // Newest orders first
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        return res.status(200).json({ success: true, orders })
    } catch (error: any) {
        console.error('Error fetching user orders:', error.message)
        return res.status(500).json({ error: 'Failed to retrieve orders' })
    }
}

export const getAllOrdersAdmin = async (req: Request, res: Response) => {
    try {
        const { status, search } = req.query

        // Dynamic Prisma filter query
        const whereClause: any = {}

        // Filter by Order Status if provided (and not "ALL")
        if (status && status !== 'ALL') {
            whereClause.status = status
        }

        // Search by Customer Name, Order ID, or Phone Number
        if (search) {
            whereClause.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { id: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string, mode: 'insensitive' } }
            ]
        }

        // Fetch filtered orders and total count for pagination
        const [orders, totalOrders] = await Promise.all([
            db.order.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true }
                    },
                    items: {
                        include: {
                            product: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }),
            db.order.count({ where: whereClause })
        ])

        return res.status(200).json({
            success: true,
            orders,
            totalOrders
        })
    } catch (error: any) {
        console.error('Error fetching admin orders:', error.message)
        return res.status(500).json({ error: 'Failed to retrieve admin orders' })
    }
}

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid order status value' })
    }

    try {
        const updatedOrder = await db.order.update({
            where: { id: id as string },
            data: { status: status }
        })

        return res.status(200).json({ order: updatedOrder })
    } catch (error: any) {
        console.error('Error updating order status:', error.message)
        return res.status(500).json({ error: 'Failed to update status' })
    }
}

export const verifyOrderPayment = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const order = await db.order.findUnique({
            where: { id: id as string },
            select: {
                id: true,
                userId: true,
                status: true,
                total: true,
                items: true,
            },
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        if ((order?.userId) as string !== (req?.user!.id) as string) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        res.status(200).json({
            success: true,
            order,
        });
    } catch (error: any) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};

export const handlePaymentWebhook = async (req: Request, res: Response) => {
    try {
        const PAYSTACK_SECRET_KEY = ENV_VARIABLES.PAYSTACK_SECRET_KEY;

        if (!PAYSTACK_SECRET_KEY) {
            throw new Error('PAYSTACK_SECRET_KEY environment variable is missing');
        }
        console.log("--- WEBHOOK HIT ---");

        const paystackSignature = req.headers['x-paystack-signature'];

        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(req.body)
            .digest('hex');

        if (hash !== paystackSignature) {
            console.log("❌ SIGNATURE MISMATCH: Request is untrusted!");
            return res.status(400).send('Invalid signature');
        }

        const event = JSON.parse(req.body.toString());

        if (event.event === 'charge.success') {
            const { orderId } = event.data.metadata;

            await db.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentReference: event.data.reference,
                },
            });

        }

        //sent so paystack can stop sending webhook
        res.status(200).send('Webhook Processed');
    } catch (error: any) {
        console.error('Webhook Error:', error.message);
        res.status(500).send(`Webhook Error: ${error.message}`);
    }
};