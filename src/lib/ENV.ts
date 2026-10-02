import 'dotenv/config'

const ENV_VARIABLES = {
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
}

export default ENV_VARIABLES;