import { Request, Response } from "express"
import { db } from "../db.js"


export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const activeUser = await db.user.count()
        const orderCount = await db.order.count()
        const productCount = await db.product.count()
        const orders = await db.order.findMany({
            where: {
                status: 'PAID'
            }  
        })

        const totalRevenue = orders.reduce((acc: number, order: { total: number}) => acc + order.total, 0)

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentOrders = await db.order.findMany({
            where: {
                status: 'PAID',
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                total: true,
                createdAt: true
            }
        })
        
        const days = [ 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT' ]

        const dailyRevenue: { [key: string]: number } = {
            SUN: 0,
            MON: 0,
            TUE: 0,
            WED: 0,
            THU: 0,
            FRI: 0,
            SAT: 0
        }

        recentOrders.forEach(order => {
            const date = new Date(order.createdAt)
            const dayIndex = date.getUTCDay()
            const dayName = days[dayIndex]   

            dailyRevenue[dayName] += order.total
        })

        const chartData = Object.keys(dailyRevenue).map(key => {
            return {
                day: key,
                revenue: (dailyRevenue[key] / 100).toFixed(2)
            }
        })

        const latestOrders = await db.order.findMany({
            take: 4,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                name: true,
                total: true,
                status: true
            }
        }) 

        // 1. Group order items by product and sum up quantities
        const topProductsGroup = await db.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc', 
                },
            },
            take: 3,
        });

        const topProducts = await Promise.all(
            topProductsGroup.map(async (item) => {
                const product = await db.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true, price: true }
                });

                const totalSalesCount = item._sum.quantity || 0;

                return {
                    id: item.productId,
                    name: product?.name || 'Unknown Product',
                    salesCount: totalSalesCount,
                    totalRevenue: totalSalesCount * (product?.price || 0)
                };
            })
        );

        res.json({
            activeUser,    
            orderCount,    
            productCount,  
            totalRevenue,
            chartData,
            latestOrders,
            topProducts
        });


    } catch (error: any) {
        console.log('Error in admin dashboard controller ', error.message)
        res.status(500).json({ error: 'Error fetching dashboard' })
    }
}
