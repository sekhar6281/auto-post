"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptionOutputSchema = exports.CaptionInputSchema = void 0;
const zod_1 = require("zod");
exports.CaptionInputSchema = zod_1.z.object({
    context: zod_1.z
        .string()
        .min(3, "Context too short")
        .max(300, "Context max 300 chars")
        .describe("One-line description of what the post is about"),
    tone: zod_1.z
        .enum(["professional", "startup-founder", "technical", "motivational"])
        .default("professional")
        .describe("Writing tone for the caption"),
    media_type: zod_1.z
        .enum(["image", "video"])
        .default("image")
        .describe("Type of media being posted"),
    media_url: zod_1.z
        .string()
        .url()
        .optional()
        .describe("Optional Cloudinary URL of the uploaded media for context"),
});
exports.CaptionOutputSchema = zod_1.z.object({
    hook: zod_1.z.string().describe("Scroll-stopping opening line"),
    body: zod_1.z.string().describe("Main caption body"),
    hashtags: zod_1.z.array(zod_1.z.string()).describe("4–6 relevant hashtags"),
    full_caption: zod_1.z.string().describe("Complete formatted caption ready to post"),
    tokens_used: zod_1.z.number().describe("Groq tokens consumed"),
});
//# sourceMappingURL=caption.schema.js.map