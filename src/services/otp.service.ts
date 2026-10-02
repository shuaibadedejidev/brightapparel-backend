import { db } from "../db.js";
import ENV_VARIABLES from "../lib/ENV.js";
import crypto from "crypto";
import nodemailer from "nodemailer";


// Create the transporter ONCE outside the function to reuse connections
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: ENV_VARIABLES.MAIL_USER,
        pass: ENV_VARIABLES.MAIL_PASS,
    },
});

export const requestOTP = async (email: string): Promise<void> => {
    // 1. Generate a secure random 6-digit number
    const rawOTP = crypto.randomInt(100000, 999999).toString();

    // 2. Hash the code before saving to the database
    const otpHash = crypto.createHash("sha256").update(rawOTP).digest("hex");

    // 3. Set expiration for 10 minutes in the future
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Upsert: Create a new record, or overwrite the existing one if the email already requested an OTP
    await db.otp.upsert({
        where: { email },
        update: {
            otpHash,
            expiresAt,
            attempts: 0, // Reset wrong attempts on new request
        },
        create: {
            email,
            otpHash,
            expiresAt,
        },
    });

    // 5. Send the raw 6-digit OTP to the user's email
    await transporter.sendMail({
        from: '"Bright" <no-reply@ctransit.com>',
        to: email,
        subject: "Verify your email",
        text: `Your OTP is: ${rawOTP}. It will expire in 10 minutes.`,
    });
};

export const verifyOTP = async (
    email: string,
    userSubmittedOTP: string
): Promise<boolean> => {
    // 1. Fetch the OTP record from Neon DB
    const record = await db.otp.findUnique({
        where: { email },
    });

    if (!record) {
        throw new Error("No OTP request found for this email.");
    }

    // 2. Check if the OTP is expired
    if (new Date() > record.expiresAt) {
        // Clean up expired record
        await db.otp.delete({ where: { email } });
        throw new Error("OTP has expired. Please request a new one.");
    }

    // 3. Check for brute-force attempts
    if (record.attempts >= 3) {
        await db.otp.delete({ where: { email } });
        throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    // 4. Hash user input to compare with stored hash
    const inputHash = crypto.createHash("sha256").update(userSubmittedOTP).digest("hex");

    if (inputHash !== record.otpHash) {
        // Increment attempts counter in Prisma
        await db.otp.update({
            where: { email },
            data: { attempts: { increment: 1 } },
        });
        throw new Error("Invalid OTP code. Try again.");
    }

    // 5. SUCCESS: Delete record immediately (Single-Use Invalidation)
    await db.otp.delete({ where: { email } });

    return true;
};