import ENV_VARIABLES from './ENV.js';
import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({
    cloud_name: ENV_VARIABLES.CLOUDINARY_CLOUD_NAME,
    api_key: ENV_VARIABLES.CLOUDINARY_API_KEY,
    api_secret: ENV_VARIABLES.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

export default cloudinary