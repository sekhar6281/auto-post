"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostOutputSchema = exports.PostInputSchema = void 0;
const zod_1 = require("zod");
exports.PostInputSchema = zod_1.z.object({
    caption: zod_1.z
        .string()
        .min(1)
        .max(3000)
        .describe("Full LinkedIn post caption (hook + body + hashtags)"),
    media_urls: zod_1.z
        .array(zod_1.z.string().url())
        .min(0)
        .max(9)
        .default([])
        .describe("Cloudinary URLs of media to attach (1–9 images OR 1 video)"),
    media_type: zod_1.z
        .enum(["image", "video"])
        .optional()
        .describe("Type of media being posted"),
    access_token: zod_1.z
        .string()
        .min(1)
        .describe("LinkedIn OAuth access token for the user"),
    linkedin_id: zod_1.z
        .string()
        .min(1)
        .describe("LinkedIn person URN ID (from OAuth profile)"),
});
exports.PostOutputSchema = zod_1.z.object({
    post_url: zod_1.z.string().describe("Live LinkedIn post URL"),
    assets_uploaded: zod_1.z.number().describe("Number of media assets uploaded to LinkedIn"),
});
//# sourceMappingURL=post.schema.js.map