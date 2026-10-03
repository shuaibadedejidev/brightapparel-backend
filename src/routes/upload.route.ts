import { Router } from 'express';
import upload from '../middlewares/upload.middlware.js';

import cloudinary from '../lib/cloudinary.js';
import { strictLimiter } from '../lib/rateLimit.js';
const router = Router();

router.post('/', strictLimiter, upload.array('files', 4), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[]; // Array of files from Multer
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadPromises = files.map((file: Express.Multer.File) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'apparel_products' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result?.secure_url); // Resolve with the Cloudinary URL
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        // 2. Wait for ALL files to finish uploading to Cloudinary
        const uploadedUrls = await Promise.all(uploadPromises);

        // 3. Return array of URLs back to React
        return res.status(200).json({ urls: uploadedUrls });
    } catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: 'Failed to upload images' });
    }
});

export default router;