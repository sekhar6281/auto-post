"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadOutputSchema = exports.UploadInputSchema = void 0;
const zod_1 = require("zod");
exports.UploadInputSchema = zod_1.z.object({
    source_url: zod_1.z
        .string()
        .url()
        .describe("Public URL of the media to upload to Cloudinary"),
    resource_type: zod_1.z
        .enum(["image", "video"])
        .default("image")
        .describe("Type of media"),
    folder: zod_1.z
        .string()
        .default("linkedin-posts")
        .describe("Cloudinary folder to upload into"),
});
exports.UploadOutputSchema = zod_1.z.object({
    cloudinary_url: zod_1.z.string().describe("Secure CDN URL of the uploaded media"),
    public_id: zod_1.z.string().describe("Cloudinary asset public ID"),
    resource_type: zod_1.z.string().describe("image or video"),
    format: zod_1.z.string().describe("File format e.g. jpg, mp4"),
    bytes: zod_1.z.number().describe("File size in bytes"),
    width: zod_1.z.number().optional(),
    height: zod_1.z.number().optional(),
});
//# sourceMappingURL=upload.schema.js.map