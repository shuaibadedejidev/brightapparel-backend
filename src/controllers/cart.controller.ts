import { Request, Response } from 'express';
import { db } from '../db.js'; 

export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const items = await db.cart.findMany({
            where: { userId },
            include: {
                product: {
                    select: { name: true, compareAtPrice: true, price: true }
                }
            }
        });

        // Format response to match Zustand store structure
        const formattedCart = items.map((item) => ({
            id: item.id, // Database Cart ID
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            compareAtPrice: item.product.compareAtPrice,
            image: item.image,
            selectedColor: item.color,
            selectedSize: item.size,
            quantity: item.quantity
        }));

        return res.status(200).json({ success: true, data: formattedCart });
    } catch (error: any) {
        console.log('Error in getCart controller', error.message) 
        return res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
};

export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { product: productId, price, image, color, size, quantity, category } = req.body;

        const cartItem = await db.cart.upsert({
            where: {
                userId_productId_color_size: {
                    userId,
                    productId,
                    color,
                    size
                }
            },
            update: {
                quantity: { increment: quantity }, 
                image
            },
            create: {
                userId,
                productId,
                image,
                color,
                size,
                quantity,
                category
            },
            include: {
                product: { select: { name: true, compareAtPrice: true, category: true, price: true } }
            }
        });

        const formattedItem = {
            id: cartItem.id,
            productId: cartItem.productId,
            name: cartItem.product.name,
            category: cartItem.category,
            price: cartItem.product.price,
            compareAtPrice: cartItem.product.compareAtPrice,
            image: cartItem.image,
            selectedColor: cartItem.color,
            selectedSize: cartItem.size,
            quantity: cartItem.quantity
        };

        return res.status(200).json({ success: true, data: formattedItem });
    } catch (error: any) {
        console.log(error.message)
        return res.status(500).json({ success: false, error: 'Failed to add item to cart' });
    }
};

export const updateQuantity = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { cartId, action, value } = req.body; // action: 'INCREMENT' | 'DECREMENT'

        const existing = await db.cart.findFirst({
            where: { id: cartId, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        let newQuantity = existing.quantity;

        if (action === 'INCREMENT') newQuantity += 1;
        if (action === 'DECREMENT') newQuantity -= 1;

        if (newQuantity <= 0) {
            await db.cart.delete({ where: { id: cartId } });
            return res.status(200).json({ success: true, message: 'Item removed', cartId });
        }

        const updated = await db.cart.update({
            where: { id: cartId },
            data: { quantity: newQuantity }
        });

        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: 'Failed to update quantity' });
    }
};

export const removeFromCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        await db.cart.deleteMany({
            where: { id: id as string, userId }
        });

        return res.status(200).json({ success: true, message: 'Item deleted', cartId: id });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete cart item' });
    }
}; 