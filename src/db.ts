import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js'; // This loads the key Prisma built for you
//import PrismaClient from '@prisma/client'; // This loads the key Prisma built for you
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

// "db" is now your remote control!
export const db = new PrismaClient({ adapter });