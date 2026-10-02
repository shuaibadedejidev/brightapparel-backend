-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'UNISEX', 'KIDS');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "compareAtPrice" INTEGER,
    "category" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "VariantColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "VariantSize_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantColor" ADD CONSTRAINT "VariantColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSize" ADD CONSTRAINT "VariantSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
