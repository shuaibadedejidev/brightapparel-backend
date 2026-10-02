import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { faker } from '@faker-js/faker';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GENDER = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] as const;

const CLOTHING_CATEGORIES = [
    'T-Shirts & Tops',
    'Hoodies & Sweatshirts',
    'Denim & Jeans',
    'Jackets & Coats',
    'Cargo Pants',
    'Dresses & Skirts',
    'Footwear & Kicks',
    'Accessories',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const COLOR_PALETTE = [
    { name: 'Onyx Black', hex: '#0F0F0F' },
    { name: 'Pure White', hex: '#FFFFFF' },
    { name: 'Vintage Olive', hex: '#556B2F' },
    { name: 'Midnight Navy', hex: '#1B263B' },
    { name: 'Sand Beige', hex: '#D2B48C' },
    { name: 'Washed Grey', hex: '#708090' },
    { name: 'Crimson Red', hex: '#990000' },
];

// Unsplash high-quality clothing photo URLs
const SAMPLE_CLOTHING_IMAGES = [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
];

async function main() {
    console.log('🌱 Clearing old data & seeding clothing stock...');

    console.log('🌱 Clearing old data & seeding clothing stock...');

    // 1. Wipe child records referencing Product FIRST
    await prisma.cart.deleteMany();
    await prisma.orderItem.deleteMany();

    // 2. Wipe product relations
    await prisma.productImage.deleteMany();
    await prisma.variantColor.deleteMany();
    await prisma.variantSize.deleteMany();

    // 3. Now it is safe to wipe Products!
    await prisma.product.deleteMany();

    // Clear existing items in safe relational order
    await prisma.productImage.deleteMany();
    await prisma.variantColor.deleteMany();
    await prisma.variantSize.deleteMany();
    await prisma.product.deleteMany();

    const TOTAL_PRODUCTS = 24;

    for (let i = 0; i < TOTAL_PRODUCTS; i++) {
        // Generate pricing in standard currency values (e.g. 15000 = ₦15,000 or $150.00 depending on your format)
        const price = faker.number.int({ min: 5000, max: 45000 });
        const hasDiscount = faker.datatype.boolean();
        const compareAtPrice = hasDiscount ? price + faker.number.int({ min: 2000, max: 10000 }) : null;

        const randomColors = faker.helpers.arrayElements(COLOR_PALETTE, { min: 1, max: 4 });
        const randomSizes = faker.helpers.arrayElements(SIZES, { min: 3, max: 6 });
        const selectedImages = faker.helpers.arrayElements(SAMPLE_CLOTHING_IMAGES, { min: 2, max: 3 });

        const clothingName = `${faker.company.buzzAdjective()} ${faker.helpers.arrayElement([
            'Oversized Tee',
            'Heavyweight Hoodie',
            'Slim-Fit Denim',
            'Puffer Jacket',
            'Cargo Trousers',
            'Graphic Sweatshirt',
            'Streetwear Cap',
        ])}`;

        await prisma.product.create({
            data: {
                name: clothingName,
                description: `Premium quality apparel piece. ${faker.commerce.productDescription()} Crafted for daily comfort and street durability.`,
                price,
                compareAtPrice,
                category: faker.helpers.arrayElement(CLOTHING_CATEGORIES),
                gender: faker.helpers.arrayElement(Object.values(GENDER)),
                isFeatured: faker.datatype.boolean({ probability: 0.25 }),
                inStock: faker.datatype.boolean({ probability: 0.9 }),
                rating: Number(faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 })),
                reviewCount: faker.number.int({ min: 5, max: 250 }),

                // Nested relations
                images: {
                    create: selectedImages.map((url) => ({ url })),
                },
                colors: {
                    create: randomColors.map((c) => ({ name: c.name, hex: c.hex })),
                },
                sizes: {
                    create: randomSizes.map((name) => ({ name })),
                },
            },
        });
    }

    console.log(`✨ Successfully seeded ${TOTAL_PRODUCTS} apparel items into your DB!`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });