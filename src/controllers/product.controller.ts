import { db } from "../db.js"
import { Request, Response } from 'express';
import cloudinary from "../lib/cloudinary.js";

interface Img {
    id: string,
    url: string,
    productId: string
}

interface Color {
    id: string,
    name: string,
    hex: string,
    productId: string
}

interface Size {
    id: string,
    name: string
    productId: string
}

export const getProductById = async (req: Request, res: Response) => {
    const { id } = req.params

    const productId = Array.isArray(id) ? id[0] : id;

    if (!productId) return res.status(400).json({ error: 'No product id provided' })

    try {
        const dbProduct = await db.product.findUnique({
            where: { id: productId },
            include: {
                images: true,
                colors: true,
                sizes: true,
            },
        })

        if (!dbProduct) return res.status(404).json({ error: 'Product not found' })
        
        const formattedProduct = {
            ...dbProduct,
            images: dbProduct.images.map((img: Img)  => img.url),
            variants: {
                colors: dbProduct.colors.map((c: Color) => ({ name: c.name, hex: c.hex })),
                sizes: dbProduct.sizes.map((s: Size) => s.name)
            }
        }

        return res.status(200).json(formattedProduct)
    } catch (error: any) {
        console.log('Error in get product by id controller', error.message)
        res.status(500).json({ error: error.message || 'Internal server error' })
    }
}

export const getFeaturedProducts = async (req: Request, res: Response) => {
    try {
        let featuredProducts = await db.product.findMany({
            where: { isFeatured: true },
            include: {
                images: true,
            },
        })

        interface FeaturedProductSummary {
            id: string;
            name: string;
            price: number;
            image: string;
        }

        const formattedFeaturedProducts: FeaturedProductSummary[] = featuredProducts.slice(0, 4).map((product: any) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0]?.url || '',
        }));

        res.status(200).json(featuredProducts)
    } catch (error: any) {
        console.log('Error in get featured products controller', error.message)
        res.status(500).json({ error: error.message || 'Internal server error' })
    }
} 

export const getAllProducts = async (req: Request, res: Response) => {
    const { category, gender } = req.query

    const whereClause: any = {}
    
    if (category) {
        const categoryList = Array.isArray(category) ? category : [category]
        whereClause.category = { in: categoryList.map(category => category?.toUpperCase()) } 
    }
    
    if (gender) {
        const genderList = Array.isArray(gender) ? gender : [gender]
        whereClause.gender = {
            in: genderList.map(gender => gender?.toUpperCase())
        }
    }


    try {
        let allProducts = await db.product.findMany({
            where: whereClause,
            include: { 
                images: true,  
                colors: true,
                sizes: true,
            },
        })

        allProducts = allProducts.map((product: any) => {
            return {
                ...product,
                images: product.images.map((img: Img) => img.url),
                variants: {
                    colors: product.colors.map((c: Color) => ({ name: c.name, hex: c.hex })),
                    sizes: product.sizes.map((s: Size) => s.name)
                }
            }
        })

        res.status(200).json(allProducts)
    } catch (error: any) {
        console.log('Error in get all product controller', error.message)
        res.status(500).json({ error: error.message || 'Internal server error' })
    }
}

import { Gender } from "../generated/prisma/enums.js";
export const createProduct = async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            price,
            compareAtPrice,
            category,
            gender,
            reviewCount,
            rating,
            isFeatured,
            productImages,
            colors,
            sizes
        } = req.body;

        const formattedGender = gender ? (gender.toUpperCase() as Gender) : Gender.UNISEX

        const formattedImages = (productImages || [])
            .filter((url: string | undefined) => Boolean(url))
            .map((url: string) => ({ url }));

        console.log(formattedImages)

        if (!name || !description || !price || !category || !gender || productImages.length === 0 || colors.length === 0 || sizes.length === 0) {
            return res.status(400).json({ error: 'All fields required' })
        }

        const newProduct = await db.product.create({
            data: {
                name,
                description,
                price, 
                compareAtPrice: compareAtPrice || null,
                category,
                gender: formattedGender,
                reviewCount: reviewCount || 0,
                rating: rating || 0,
                isFeatured: isFeatured || false,

                sizes: {
                    create: sizes.map((size: string) => ({ name: size} ))
                },

                images: {
                    create: formattedImages.map((image: { url: string }) => ({ url: image.url }))
                }, 

                colors: {
                    create: colors
                }
            }
        });

        return res.status(201).json(newProduct);
    } catch (error: any) {
        console.error('Error creating product:', error.message);
        return res.status(500).json({ error: error.message || 'Failed to create product' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    console.log('I got a req')
    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'No product id provided' })
    try {
        const {
            name,
            description,
            price,
            compareAtPrice,
            category, 
            gender,
            reviewCount,
            rating,
            isFeatured,
            productImages,
            colors,
            sizes
        } = req.body;

        const formattedGender = gender ? (gender.toUpperCase() as Gender) : Gender.UNISEX

        const formattedImages = (productImages || [])
            .filter((url: string | undefined) => Boolean(url))
            .map((url: string) => ({ url }));

        if (!name || !description || !price || !category || !gender || productImages.length === 0 || colors.length === 0 || sizes.length === 0) {
            return res.status(400).json({ error: 'All fields required' })
        }

        const updatedProduct = await db.product.update({
            where: { id: id as string },
            data: {
                name,
                description,
                price,
                compareAtPrice: compareAtPrice || null,
                category,
                gender: formattedGender,
                reviewCount: reviewCount || 0,
                rating: rating || 0,
                isFeatured: isFeatured || false,

                sizes: {
                    deleteMany: {}, 
                    create: sizes.map((size: { name: string }) => ({ name: size.name })) 
                },

                images: {
                    deleteMany: {}, // 1. Clear old image records
                    create: formattedImages.map((image: { url: string }) => ({ url: image.url })) 
                },

                colors: {
                    deleteMany: {}, // 1. Clear old color records
                    create: colors.map((color: { name: string; hex: string }) => ({
                        name: color.name,
                        hex: color.hex
                    })) 
                }
            }
        });

        return res.status(201).json(updateProduct);
    } catch (error: any) {
        console.error('Error updating product:', error.message);
        return res.status(500).json({ error: error.message || 'Failed to update product' });
    }
};

const getPublicIdFromUrl = (url: string) => {
    const parts = url.split('/');
    const filename = parts.pop() || '';
    const folder = parts.slice(parts.indexOf('upload') + 2).join('/');
    const publicId = filename.split('.')[0];
    return folder ? `${folder}/${publicId}` : publicId;
};

export const deleteProduct = async (req: Request, res: Response) => {
    const id = req.params.id 

    if (!id) return res.status(400).json({ error: 'Product id was not provided' })

    try {
        const product = await db.product.findUnique({
            where: { id: id as string },
            include: {
                images: true,
            },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // 1. Delete all associated images from Cloudinary concurrently
        if (product.images.length > 0) {
            const deletePromises = product.images.map((image) => {
                const publicId = getPublicIdFromUrl(image.url);
                return cloudinary.uploader.destroy(publicId);
            });

            await Promise.all(deletePromises);
        }

        // 2. Delete the product record from the database
        await db.product.delete({
            where: { id: id as string },
        });

        return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
