"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaTool = uploadMediaTool;
const cloudinary_1 = require("cloudinary");
function initCloudinary() {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary env vars not configured");
    }
    cloudinary_1.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}
async function uploadMediaTool(input) {
    initCloudinary();
    const result = await cloudinary_1.v2.uploader.upload(input.source_url, {
        folder: input.folder,
        resource_type: input.resource_type,
    });
    return {
        cloudinary_url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
    };
}
//# sourceMappingURL=upload-media.js.map